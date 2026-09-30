# 2048 Game — DevOps Lab

A production-ready **Flask 2048** game used to practice containerization, CI, metrics, and cloud deploy. **Live hosting** is on **[Render](https://render.com)** via `render.yaml` and `Dockerfile`. Kubernetes/Helm assets in this repo are **optional reference** from the lab phase.

---

## Project summary

| Area | What we built |
|------|----------------|
| **Application** | 2048 in the browser (keyboard + touch), Flask API for moves/resets |
| **Container** | Multi-stage-hardened `Dockerfile`, Gunicorn, non-root user, health checks |
| **CI** | GitHub Actions: pytest, Docker build, Trivy (HIGH/CRITICAL) |
| **Production** | Render Web Service (Docker), auto-deploy from `main`, `/healthz` health check |
| **Observability** | Prometheus metrics at `/metrics` (`flask_http_*`, `game_*`) |
| **Optional lab** | Kind, Helm, Prometheus, Grafana, Loki, NGINX Ingress (documented, not required for Render) |

**Outcome:** One public URL on Render for the game; metrics and logs via Render; local K8s stack optional and removable ([`docs/TEARDOWN-KIND.md`](docs/TEARDOWN-KIND.md)).

---

## Live endpoints (Render)

Replace with your service name:

| URL | Purpose |
|-----|---------|
| `https://<service>.onrender.com/` | Play the game |
| `https://<service>.onrender.com/healthz` | Liveness |
| `https://<service>.onrender.com/readyz` | Readiness |
| `https://<service>.onrender.com/metrics` | Prometheus text format |

Logs: **Render dashboard → your service → Logs**.

---

## Quick start

### Deploy (Render)

1. Push this repo to GitHub.
2. Render → **Blueprint** → connect repo → apply [`render.yaml`](render.yaml).  
   Or: **Web Service** → Docker → health path `/healthz`.

Full guide: [`docs/RENDER-DEPLOY.md`](docs/RENDER-DEPLOY.md).

### Develop locally

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000

```bash
pytest -q
```

### Run with Docker (same image as Render)

```bash
docker build -t 2048-game .
docker run --rm -p 5000:5000 2048-game
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/RENDER-DEPLOY.md`](docs/RENDER-DEPLOY.md) | **Primary** — deploy and operate on Render |
| [`docs/TEARDOWN-KIND.md`](docs/TEARDOWN-KIND.md) | Remove local Kind when using Render only |
| [`docs/GRAFANA-QUERIES.md`](docs/GRAFANA-QUERIES.md) | PromQL examples |
| [`docs/README.md`](docs/README.md) | Full documentation index |

Optional lab: `HELM-DEPLOY.md`, `HELM-OBSERVABILITY.md`, `DOCKER-HUB.md`, `K8S-NGINX-INGRESS.md`.

---

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) — pytest, Docker build, Trivy; optional Docker Hub push; Render deploys from GitHub.

---

## Security

Do not commit secrets. `/metrics` on Render free tier is public (OK for demos).

---

*Final stack: **GitHub → Render (Docker)** for the live game; optional Kind/Helm/Grafana docs retained for portfolio reference.*
