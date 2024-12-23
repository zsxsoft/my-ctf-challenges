package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/clientcmd"
	kubevirtv1 "kubevirt.io/api/core/v1"
	"kubevirt.io/client-go/kubecli"
	"sigs.k8s.io/yaml"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
var kubevirtClient kubecli.KubevirtClient
var quayHost string

type vmConsoleQuery struct {
	Name string `form:"name" binding:"required,dns_rfc1035_label"`
}

type vmYamlBody struct {
	YAML string `json:"yaml" binding:"required"`
}

func GenerateVirtualMachine(name string, input string) (*kubevirtv1.VirtualMachine, error) {
	vm := kubevirtv1.VirtualMachine{}

	// I can't find a simple way to make a image whitelist
	// So just ban all `image` keyword
	if strings.Count(input, "image") > 1 {
		return nil, errors.New("image is not allowed")
	}
	if strings.Contains(input, "\\u") || strings.Contains(input, "\\x") {
		return nil, errors.New("ban unicode")
	}
	// wow fuck yaml
	if strings.Contains(input, "!!") {
		return nil, errors.New("wow yaml")
	}
	err := yaml.Unmarshal([]byte(input), &vm)
	if err != nil {
		return nil, err
	}

	running := true
	vm.Spec.Running = &running // Start vm automatically
	vm.Name = name
	vm.Spec.Template.ObjectMeta.Labels = map[string]string{
		"kubevirt.io/domain": vm.Name,
		"kubevirt.io/size":   "tiny",
	}
	vm.Spec.Template.Spec.Domain.Resources.Requests = v1.ResourceList{
		v1.ResourceCPU:    resource.MustParse("0.1"),
		v1.ResourceMemory: resource.MustParse("64M"),
	}
	vm.Spec.Template.Spec.Domain.Resources.Limits = v1.ResourceList{
		v1.ResourceCPU:    resource.MustParse("0.5"),
		v1.ResourceMemory: resource.MustParse("256M"),
	}
	for i, v := range vm.Spec.Template.Spec.Volumes {
		if v.VolumeSource.ContainerDisk != nil {
			vm.Spec.Template.Spec.Volumes[i].VolumeSource.ContainerDisk.Image = quayHost + "/kubevirt/cirros-container-disk-demo:v0.36.4"
		}
	}

	return &vm, nil
}

func FormatYAMLController(c *gin.Context) {
	var q vmYamlBody
	err := c.BindJSON(&q)
	if err != nil {
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}
	vm, err := GenerateVirtualMachine("test", q.YAML)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	a, err := yaml.Marshal(&vm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.Data(http.StatusOK, "application/yaml", a)
}

func RunVMController(c *gin.Context) {
	var q vmYamlBody
	err := c.BindJSON(&q)
	if err != nil {
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}
	uuid := uuid.New()
	name := "vm-" + uuid.String()
	vm, err := GenerateVirtualMachine(name, q.YAML)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	log.Printf("Create VM: %s\n", name)
	_, err = kubevirtClient.VirtualMachine("default").Create(context.Background(), vm, metav1.CreateOptions{})
	if err != nil {
		log.Printf("Create VM error: %s\n", err.Error())
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	os.Mkdir("./logs/"+name, 0755)
	os.WriteFile("./logs/"+name+"/vm.yaml", []byte(q.YAML), 0644)

	c.JSON(http.StatusOK, gin.H{"name": name})
	go func() {
		time.Sleep(2 * time.Minute)
		log.Printf("Delete VM: %s", name)
		err := kubevirtClient.VirtualMachine("default").Delete(context.Background(), name, metav1.DeleteOptions{})
		if err != nil {
			log.Printf("Delete VM error: %s\n", err.Error())
		}
	}()
}

func handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	defer conn.Close()
	var q vmConsoleQuery
	err = c.BindQuery(&q)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Get VM Name error: "+err.Error()))
		return
	}
	for {
		vm, err := kubevirtClient.VirtualMachine("default").Get(context.Background(), q.Name, metav1.GetOptions{})
		if err != nil {
			conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("Get VM error: %s\n", err.Error())))
			return
		}
		if vm.Status.Ready {
			break
		}
		b, _ := json.Marshal(vm.Status)
		conn.WriteMessage(websocket.TextMessage, append(b, '\n'))
		time.Sleep(1 * time.Second)
	}

	cmd := exec.Command("virtctl", "console", q.Name)
	cmd.Stderr = cmd.Stdout
	stdin, err := cmd.StdinPipe()
	if err != nil {
		log.Println("stdin pipe:", err)
		return
	}
	defer stdin.Close()
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Println("stdout pipe:", err)
		return
	}
	defer stdout.Close()

	if err := cmd.Start(); err != nil {
		log.Println("start:", err)
		return
	}

	go func() {
		buf := make([]byte, 1024)
		logWriter, err := os.OpenFile("./logs/"+q.Name+"/console.log", os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			log.Print(err.Error())
			return
		}
		defer logWriter.Close()
		logWriter.Write([]byte(fmt.Sprintf("#IP: %s\n", c.ClientIP())))
		for {
			nr, er := stdout.Read(buf)
			if nr <= 0 || er != nil {
				break
			}
			writer, _ := conn.NextWriter(websocket.BinaryMessage)
			logWriter.Write(buf[0:nr])
			nw, ew := writer.Write(buf[0:nr])
			if nw < 0 || ew != nil {
				break
			}
			writer.Close()
		}
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}
		_, err = stdin.Write(message)
		if err != nil {
			break
		}
	}
}

func main() {
	/*
		config, err := rest.InClusterConfig()
		if err != nil {
			log.Fatalf("Error creating config: %v", err)
		}
	*/
	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig == "" {
		kubeconfig = os.ExpandEnv("$HOME/.kube/config")
	}
	quayHost = os.Getenv("QUAY_HOST")
	if quayHost == "" {
		quayHost = "quay.io"
	}
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		log.Fatalf("Error creating config from kubeconfig: %v", err)
	}
	kubecli, err := kubecli.GetKubevirtClientFromRESTConfig(config)
	if err != nil {
		log.Fatalf("Error creating kubevirt client: %v", err)
	}
	kubevirtClient = kubecli

	r := gin.Default()
	r.Static("/static", "./static")
	r.StaticFile("/", "./static/index.html")
	r.POST("/api/format", FormatYAMLController)
	r.POST("/api/run", RunVMController)
	r.GET("/api/console", handleWebSocket)
	r.Run() // listen and serve on 0.0.0.0:8080
}
