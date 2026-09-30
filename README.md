# 2048 Game — DevOps Lab

A **Flask 2048** game with Docker, GitHub Actions (pytest + Trivy), Prometheus metrics, and optional Kubernetes/Helm reference material from the lab phase.

**Status:** Project complete. The **Render** production deployment has been removed. Run the game locally or with Docker; CI still validates every push to `main`.

---

## What we built

| Area | Details |
|------|---------|
| **Application** | 2048 in the browser, player names, high-score record API |
| **Container** | Hardened `Dockerfile`, Gunicorn, `/healthz`, `/metrics` |
| **CI** | [`.github/workflows/cicd.yml`](.github/workflows/cicd.yml) — pytest, Docker build, Trivy |
| **Optional** | Push to `srujan12/2048-game` on Docker Hub if secrets are set |
| **Lab reference** | Kind, Helm, Grafana, Loki docs under `docs/` and `helm/` |

---

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000

```bash
PYTHONPATH=. pytest -q
```

### Docker

```bash
docker build -t 2048-game .
docker run --rm -p 5000:5000 2048-game
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/PROJECT-COMPLETE.md`](docs/PROJECT-COMPLETE.md) | Wrap-up and teardown notes (Render removed) |
| [`docs/GITHUB-ACTIONS.md`](docs/GITHUB-ACTIONS.md) | CI workflow |
| [`docs/README.md`](docs/README.md) | Full doc index |
| [`docs/archive/render.yaml`](docs/archive/render.yaml) | Former Render Blueprint (reference only) |

Optional lab: `HELM-DEPLOY.md`, `HELM-OBSERVABILITY.md`, `TEARDOWN-KIND.md`, etc.

---

## CI/CD

On every **PR** and **push** to `main`: **test** → **docker + Trivy**.  
**Docker Hub push** runs on `main` only when `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets exist.

You can remove unused GitHub secrets (`RENDER_API_KEY`, `RENDER_SERVICE_ID`, `RENDER_SERVICE_URL`) from the repository settings.

---

*Portfolio stack: Flask → Docker → GitHub Actions; cloud deploy was on Render during the lab and has been torn down.*
