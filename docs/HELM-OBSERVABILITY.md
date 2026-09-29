# Prometheus, Grafana & Loki (Helm)

Observability runs in namespace **`observability`**. The game stays in **`game-lab`**.

## 1. Helm repos

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

## 2. Namespace

```bash
kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -
```

## 3. Prometheus + Grafana + Alertmanager

```bash
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace observability \
  -f helm/observability/kube-prometheus-stack-values.yaml \
  --wait --timeout 15m
```

## 4. Loki (logs)

```bash
helm upgrade --install loki grafana/loki \
  --namespace observability \
  -f helm/observability/loki-values.yaml \
  --wait --timeout 10m
```

## 5. Promtail (ship pod logs to Loki)

```bash
helm upgrade --install promtail grafana/promtail \
  --namespace observability \
  -f helm/observability/promtail-values.yaml \
  --wait --timeout 5m
```

## 6. Scrape 2048 game metrics

```bash
helm upgrade 2048-game ./helm/2048-game \
  --namespace game-lab \
  --reuse-values \
  --set serviceMonitor.enabled=true
```

## 7. Import Grafana dashboard (optional)

Upload `helm/observability/grafana-dashboard-2048.json` in Grafana → Import.

Loki logs query:

```logql
{namespace="game-lab", pod=~"2048-game.*"}
```

## 8. Open UIs

```bash
kubectl -n observability port-forward svc/kube-prometheus-stack-grafana 3000:80
kubectl -n observability port-forward svc/kube-prometheus-stack-prometheus 9090:9090
kubectl -n observability port-forward svc/kube-prometheus-stack-alertmanager 9093:9093
```

Grafana: http://localhost:3000 — `admin` / `changeme`
