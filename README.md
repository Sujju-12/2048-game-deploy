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

## Current DevOps platform

The repository now has the first local deployment layer:

1. GitHub pull-request/main workflow.
2. Pytest application tests.
3. Docker image build.
4. Trivy HIGH/CRITICAL vulnerability scanning.
5. Docker Hub image publishing on pushes to main.
6. Local Kind Kubernetes deployment.
7. Kubernetes Deployment with 2 replicas and rolling updates.
8. Kubernetes Service and liveness/readiness probes.
9. Local deployment helper under scripts/kind-deploy.sh.

The next platform layers can be added incrementally:

10. Helm chart for the Flask application.
11. GitOps repository structure and Argo CD.
12. Horizontal scaling and rollout strategies.
13. Prometheus and Grafana dashboards/alerts.
14. Grafana Loki for centralized application logs.

## GitHub Actions + Docker Hub

The workflow is `.github/workflows/ci.yml`.

Configure these GitHub repository secrets before pushing to `main`:

- `DOCKERHUB_USERNAME` — your Docker Hub username.
- `DOCKERHUB_TOKEN` — a Docker Hub access token with permission to push the repository.

The workflow runs tests on pull requests and on pushes to `main`. On `main`, it builds and scans the image and publishes:

```text
<DOCKERHUB_USERNAME>/2048-game:latest
<DOCKERHUB_USERNAME>/2048-game:sha-<commit-sha>
```

GitHub Actions cannot directly deploy into the Kind cluster running on your personal machine. The local Kind deployment is therefore intentionally a separate local step.

## Local Kind deployment

Create a Kind cluster if you do not already have one:

```bash
kind create cluster --name devops-lab
```

For a local-only image workflow:

```bash
bash scripts/kind-deploy.sh
```

The script builds `2048-game:dev`, loads it into Kind, applies the Kubernetes resources, and waits for the rollout.

Then expose the Service locally:

```bash
kubectl -n game-lab port-forward svc/2048-game 5000:5000
```

Open `http://localhost:5000`.

Useful checks:

```bash
kubectl get pods -n game-lab
kubectl get svc -n game-lab
kubectl describe deployment 2048-game -n game-lab
kubectl logs -n game-lab deployment/2048-game
kubectl rollout status deployment/2048-game -n game-lab
```

## Security rule

Never commit real secrets, tokens, passwords, private keys, or production `.env` files. Use GitHub Actions secrets for CI credentials and Kubernetes Secrets or a dedicated secret-management workflow later in the platform build.
