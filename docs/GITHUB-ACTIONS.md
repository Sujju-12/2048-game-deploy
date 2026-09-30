# GitHub Actions CI (`cicd.yml`)

Workflow: [`.github/workflows/cicd.yml`](../.github/workflows/cicd.yml)

**Render deploy was removed** when the project ended. CI is test + security scan only, with an optional Docker Hub push.

## Pipeline

```text
test → docker (Trivy) → push-dockerhub (optional, main only)
```

| Trigger | Test | Trivy | Docker Hub push |
|---------|------|-------|-----------------|
| Pull request | Yes | Yes | No |
| Push to `main` | Yes | Yes | Yes, if secrets set |
| Manual | Yes | Yes | Unless **skip push** is enabled |

## Secrets (optional)

| Secret | Purpose |
|--------|---------|
| `DOCKERHUB_USERNAME` | e.g. `srujan12` |
| `DOCKERHUB_TOKEN` | Hub access token (Read & Write) |

If these are missing, the push job logs a skip message and **does not fail** the workflow.

## Manual run

**Actions** → **CI/CD** → **Run workflow** on `main`.

## Historical

Render API deploy (`RENDER_API_KEY`, `RENDER_SERVICE_ID`) was used during the lab. Remove those secrets from the repo if you no longer need them.
