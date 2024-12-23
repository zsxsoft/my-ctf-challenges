Welcome to 0CTF2024 KubeVirt challange! As the old saying goes, *a web player who can't escape the virtual machine is not a good reverse engineering master*. So it comes.

It's hard to dockerize a Kubernetes cluster, so this challenge will run without containerization.

## Prepare environment

### Install Kubernetes & KubeVirt

If you don't have Kubernetes, try [minikube](https://minikube.sigs.k8s.io/docs/start/) or [k3s](https://k3s.io/),.

**IMPORTANT NOTICE**: The Kubernetes distribution is not relevant for this challenge, the server is **NOT** using minikube / k3s.

```bash
minikube start --driver=docker --kubernetes-version=1.28.3 --cni=calico
kubectl create -f compile-readflag.yaml
kubectl create -f rbac.yaml
kubectl create -f https://github.com/kubevirt/kubevirt/releases/download/v1.3.1/kubevirt-operator.yaml
kubectl create -f kubevirt-cr.yaml
```

If you're living in China, use this:
```bash
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh -o k3s-install.sh
INSTALL_K3S_MIRROR=cn sh k3s-install.sh --system-default-registry "registry.cn-hangzhou.aliyuncs.com"
sed -i 's#muslcc#dockerpull.org/muslcc#g' compile-readflag.yaml
kubectl create -f compile-readflag.yaml
kubectl create -f rbac.yaml
kubectl create -f calico-operator-cn.yaml
kubectl create -f kubevirt-operator-v1.3.1-cn.yaml
kubectl create -f kubevirt-cr.yaml
```

Then wait for the KubeVirt to be ready:
```bash
kubectl get kubevirt.kubevirt.io/kubevirt -n kubevirt -o=jsonpath="{.status.phase}"
```

Now you can test to create a VM:

```bash
# Global
kubectl create -f https://kubevirt.io/labs/manifests/vm.yaml
./virtctl-v1.3.1-linux-amd64 start testvm
# China
kubectl create -f vm-cn.yaml
```

You can check the status of the VM by `kubectl get vms`.


### Run the challenge
```bash
cp virtctl-v1.3.1-linux-amd64 challenge/
./create-kubeconfig.sh
cd challenge
# Edit docker-compose QUAY_HOST if you're living in China!
docker-compose up -d
```

