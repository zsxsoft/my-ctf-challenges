#!/bin/bash

NAMESPACE="default"
SERVICE_ACCOUNT_NAME="kubevirt-vm-user"
KUBECONFIG_FILE="challenge/.kubeconfig"

function k() {
  if command -v kubectl &> /dev/null; then
    kubectl "$@"
  elif command -v minikube &> /dev/null; then
    minikube kubectl -- "$@"
  else
    echo "Error: Neither 'kubectl' nor 'minikube' could be found on your PATH."
    return 1
  fi
}

TOKEN=$(k get secret/$SERVICE_ACCOUNT_NAME-token -o jsonpath='{.data.token}' | base64 --decode)
CA_DATA=$(k get secret/$SERVICE_ACCOUNT_NAME-token -o jsonpath='{.data.ca\.crt}')
KUBE_API_SERVER=$(k config view --raw -o jsonpath='{.clusters[0].cluster.server}')
cat <<EOF > $KUBECONFIG_FILE
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $CA_DATA
    server: $KUBE_API_SERVER
  name: default
contexts:
- context:
    cluster: default
    user: $SERVICE_ACCOUNT_NAME
  name: default
current-context: default
users:
- name: $SERVICE_ACCOUNT_NAME
  user:
    token: $TOKEN
EOF

