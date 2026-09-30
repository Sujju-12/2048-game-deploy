# Watch Render metrics in local Prometheus & Grafana

Prometheus on Kind scrapes `https://<your-app>.onrender.com/metrics`. Grafana uses the same in-cluster Prometheus data source.

## 1. Test metrics

```bash
curl -sS "https://YOUR-SERVICE.onrender.com/metrics" | head
```

## 2. Edit and apply scrape config

Edit `helm/observability/values-render-scrape.yaml` (set your hostname), then:

```bash
helm upgrade kube-prometheus-stack charts/kube-prometheus-stack \
  --namespace observability \
  -f helm/observability/kube-prometheus-stack-values.yaml \
  -f helm/observability/values-render-scrape.yaml \
  --wait --timeout 15m
```

## 3. Verify

Prometheus → **Targets** → `render-2048-game` UP.

```promql
sum(rate(flask_http_requests_total{environment="render"}[5m]))
```

See repo README table for Kind vs Render labels.
