# 2048 Game — DevOps / GitOps Lab

A small Flask 2048 game used as the application workload for an end-to-end local DevOps platform.

## Application layer

The application currently provides:

- Browser-playable 2048 game with keyboard and touch controls.
- Flask HTTP server.
- `/healthz` for liveness checks.
- `/readyz` for readiness checks.
- `/metrics` in Prometheus exposition format.
- Game move and reset counters for observability.
- JSON API endpoints used by the frontend.
- Production container entrypoint through Gunicorn.
- Non-root container user.
- Environment variables documented through `.env.example`.
- Basic automated tests with pytest.

Flask's built-in server is intended for development rather than production deployment, so the container runs Gunicorn instead. See the Flask documentation for the distinction. 

## Run locally

```bash
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`.

Health endpoint:

```bash
curl http://localhost:5000/healthz
```

Metrics:

```bash
curl http://localhost:5000/metrics
```

Tests:

```bash
pytest -q
```

## Build the container

```bash
docker build -t 2048-game:dev .
docker run --rm -p 5000:5000 2048-game:dev
```

Then open `http://localhost:5000`.

## Planned platform progression

This repo is intentionally split into application and platform concerns so the infrastructure can be built as a learning exercise:

1. Git branching and pull-request workflow.
2. CI: tests, linting, SAST, dependency/security scanning, and secret scanning.
3. Docker image build and image vulnerability scanning.
4. Local Kubernetes cluster.
5. Helm chart for the Flask application.
6. Kubernetes resource limits/requests, probes, Service, and ConfigMap/Secret patterns.
7. GitOps repository structure and Argo CD.
8. Horizontal scaling and rollout strategies.
9. Prometheus and Grafana dashboards/alerts.
10. Grafana Loki for centralized application logs.

## Security rule

Never commit real secrets, tokens, passwords, private keys, or production `.env` files. Use Kubernetes Secrets or a dedicated secret-management workflow later in the platform build.

## Suggested target repository structure

```text
2048-game-deploy/
├── app.py
├── requirements.txt
├── Dockerfile
├── .env.example
├── .gitignore
├── templates/
│   └── index.html
├── static/
│   ├── game.js
│   └── style.css
└── tests/
    └── test_app.py
```

The Kubernetes manifests, Helm chart, Argo CD configuration, CI pipeline, and observability stack are deliberately left for the DevOps portion of the lab.
