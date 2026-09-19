#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-devops-lab}"
IMAGE="${IMAGE:-2048-game:dev}"

echo "==> Building ${IMAGE}"
docker build -t "${IMAGE}" .

echo "==> Loading image into Kind cluster: ${CLUSTER_NAME}"
kind load docker-image "${IMAGE}" --name "${CLUSTER_NAME}"

echo "==> Applying Kubernetes resources"
kubectl apply -k k8s/

echo "==> Updating deployment image"
kubectl -n game-lab set image deployment/2048-game 2048-game="${IMAGE}"

echo "==> Waiting for rollout"
kubectl -n game-lab rollout status deployment/2048-game --timeout=120s

echo
echo "Application is available with:"
echo "  kubectl -n game-lab port-forward svc/2048-game 5000:5000"
echo
echo "Then open: http://localhost:5000"
