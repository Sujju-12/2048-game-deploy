FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir --disable-pip-version-check --upgrade \
        "setuptools>=78.1.1" \
        "msgpack>=1.2.1"

RUN addgroup --system app && adduser --system --ingroup app app

COPY requirements.txt ./
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt \
    && pip uninstall -y pip setuptools wheel 2>/dev/null || true

COPY app.py ./
COPY templates ./templates
COPY static ./static

RUN chown -R app:app /app
USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import os,urllib.request; p=os.getenv('PORT','5000'); urllib.request.urlopen(f'http://127.0.0.1:{p}/healthz', timeout=2)"

# Render and other PaaS set PORT at runtime (default 5000 for local Docker).
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --access-logfile - --error-logfile - app:app"]
