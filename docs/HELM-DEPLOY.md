# Deploy on local Kind with Helm

Image on Docker Hub: **`srujan12/2048-game:latest`**

Prerequisites: image pushed, `kind`, `kubectl`, `helm`.

## 1. Kind cluster (once)

```bash
kind create cluster --name devops-lab
kubectl cluster-info
```

## 2. Metrics-server (for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

## 3. Helm install (copy-paste)

```bash
helm upgrade --install 2048-game ./helm/2048-game \
  --namespace game-lab \
  --create-namespace \
  --set image.repository=srujan12/2048-game \
  --set image.tag=latest \
  --set image.pullPolicy=Always \
  --wait --timeout 5m
```

## 4. Helm upgrade (after new image push)

```bash
helm upgrade 2048-game ./helm/2048-game \
  --namespace game-lab \
  --set image.repository=srujan12/2048-game \
  --set image.tag=latest \
  --reuse-values
```

Or restart pods to re-pull `latest`:

```bash
kubectl -n game-lab rollout restart deployment/2048-game
```

## 5. Verify

```bash
helm list -n game-lab
kubectl -n game-lab get pods,svc,hpa
kubectl -n game-lab describe pod -l app=2048-game | grep -i image
```

## 6. Play

```bash
kubectl -n game-lab port-forward svc/2048-game 5000:5000
```

http://localhost:5000

## 7. Uninstall

```bash
helm uninstall 2048-game -n game-lab
```

## Docker build & push (srujan12)

```bash
docker login docker.io -u srujan12
docker build -t srujan12/2048-game:latest .
docker push srujan12/2048-game:latest
```

If push resolves the wrong host, use:

```bash
docker build -t docker.io/srujan12/2048-game:latest .
docker push docker.io/srujan12/2048-game:latest
```

## Dry-run

```bash
helm template 2048-game ./helm/2048-game \
  --set image.repository=srujan12/2048-game \
  --set image.tag=latest
```
