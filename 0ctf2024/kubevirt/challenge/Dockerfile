FROM library/golang:1.22.3-alpine3.19 as builder
WORKDIR /app
COPY go.* ./
#RUN go env -w GOPROXY=https://goproxy.cn,direct
RUN go mod download
COPY . .
RUN go build -v -o kubevirt

FROM alpine:3.19
COPY virtctl-v1.3.1-linux-amd64 /usr/bin/virtctl
#RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk --no-cache add ca-certificates tini kubectl && chmod +x /usr/bin/virtctl

WORKDIR /app
COPY --from=builder /app/kubevirt .

CMD ["tini", "/app/kubevirt"]