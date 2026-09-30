# GitHub Actions — test & deploy

Workflow: [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

## What runs when

| Event | Test | Docker + Trivy | Deploy Render |
|--------|------|----------------|---------------|
| Pull request to `main` | Yes | Yes | No |
| Push to `main` | Yes | Yes | Yes |
| Manual workflow | Yes | Yes | Yes (unless skip deploy) |

## Setup

1. Render → your service → **Settings** → **Deploy Hook** → copy URL.
2. GitHub → **Settings → Secrets → Actions** → `RENDER_DEPLOY_HOOK` = that URL.
3. Optional: `RENDER_SERVICE_URL` = `https://your-app.onrender.com`
4. In Render UI, turn **off** auto-deploy if it was on (repo uses `autoDeploy: false` in `render.yaml`).

## Feature branches

Open a **PR to `main`** — tests run, no deploy. Merge → deploy.

## Manual run

**Actions** → **Test and Deploy** → **Run workflow**.
