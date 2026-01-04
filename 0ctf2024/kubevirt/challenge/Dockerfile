FROM library/golang:1.22.3-alpine3.19 as builder
WORKDIR /app
COPY go.* ./
#RUN go env -w GOPROXY=https://goproxy.cn,direct
RUN go mod download
COPY . .
RUN go build -v -o kubevirt

FROM alpine:3.19
#RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk --no-cache add ca-certificates tini kubectl wget && \
    wget https://github.com/kubevirt/kubectl-virt-plugin/releases/download/v1.3.1/virtctl-linux-amd64.tar.gz -O /tmp/virtctl-linux-amd64.tar.gz && \
    cd /tmp && \
    tar -xzf virtctl-linux-amd64.tar.gz && \
    mv virtctl/virtctl-linux-amd64 /usr/local/bin/virtctl && \
    rm -rf /tmp/virtctl*

WORKDIR /app
COPY --from=builder /app/kubevirt .

CMD ["tini", "/app/kubevirt"]