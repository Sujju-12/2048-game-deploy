# Project complete

The lab is finished. The live **Render** web service has been deleted.

## What still works

- **Local:** `python app.py` or `docker run` (see root [README](../README.md))
- **CI:** GitHub Actions runs tests and Trivy on every push/PR
- **Docker Hub:** Optional image push on `main` if Hub secrets remain configured
- **Repo:** All code, Helm charts, and docs stay for reference

## Cleanup checklist (optional)

| Item | Action |
|------|--------|
| Render service | Deleted in Render dashboard |
| GitHub secrets | Remove `RENDER_API_KEY`, `RENDER_SERVICE_ID`, `RENDER_SERVICE_URL`, `RENDER_DEPLOY_HOOK` if present |
| Docker Hub | Keep or delete image `srujan12/2048-game` as you prefer |
| Kind cluster | See [TEARDOWN-KIND.md](TEARDOWN-KIND.md) if you still have a local cluster |

## Redeploying later

Use the archived Blueprint at [`archive/render.yaml`](archive/render.yaml) or any host that runs the Docker image. Wire deploy back into CI only if you add a new platform.
