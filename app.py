import json
import os
import re
import time
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", "16384"))

REQUEST_COUNT = Counter(
    "flask_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)
REQUEST_LATENCY = Histogram(
    "flask_http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
)
GAME_MOVES = Counter(
    "game_moves_total",
    "Total 2048 moves submitted",
    ["direction"],
)
GAME_RESETS = Counter("game_resets_total", "Total 2048 game resets")

HIGHSCORE_PATH = Path(os.getenv("HIGHSCORE_FILE", "/tmp/2048-highscore.json"))
_NAME_RE = re.compile(r"^[\w][\w\s'.-]{0,39}$", re.UNICODE)


def _load_highscore():
    try:
        if HIGHSCORE_PATH.exists():
            data = json.loads(HIGHSCORE_PATH.read_text(encoding="utf-8"))
            name = str(data.get("name", "")).strip()[:40]
            score = int(data.get("score", 0))
            return {"name": name, "score": max(0, score)}
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        pass
    return {"name": "", "score": 0}


def _save_highscore(name: str, score: int) -> dict:
    current = _load_highscore()
    if score <= current["score"]:
        return current
    record = {"name": name, "score": score}
    HIGHSCORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    HIGHSCORE_PATH.write_text(json.dumps(record), encoding="utf-8")
    return record


def instrument_response(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        started = time.perf_counter()
        response = func(*args, **kwargs)
        status = getattr(response, "status_code", 200)
        endpoint = request.path
        REQUEST_COUNT.labels(request.method, endpoint, str(status)).inc()
        REQUEST_LATENCY.labels(request.method, endpoint).observe(time.perf_counter() - started)
        return response

    return wrapper


@app.route("/")
@instrument_response
def index():
    return render_template("index.html")


@app.route("/healthz", methods=["GET"])
@instrument_response
def healthz():
    return jsonify({"status": "ok"}), 200


@app.route("/readyz", methods=["GET"])
@instrument_response
def readyz():
    return jsonify({"status": "ready"}), 200


@app.route("/api/move", methods=["POST"])
@instrument_response
def record_move():
    payload = request.get_json(silent=True) or {}
    direction = str(payload.get("direction", "unknown")).lower()
    allowed = {"up", "down", "left", "right"}
    if direction not in allowed:
        return jsonify({"error": "invalid direction"}), 400
    GAME_MOVES.labels(direction).inc()
    return jsonify({"status": "ok"}), 200


@app.route("/api/reset", methods=["POST"])
@instrument_response
def record_reset():
    GAME_RESETS.inc()
    return jsonify({"status": "ok"}), 200


@app.route("/api/highscore", methods=["GET"])
@instrument_response
def get_highscore():
    return jsonify(_load_highscore()), 200


@app.route("/api/highscore", methods=["POST"])
@instrument_response
def post_highscore():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    if not name or not _NAME_RE.match(name):
        return jsonify({"error": "invalid name"}), 400
    try:
        score = int(payload.get("score", -1))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid score"}), 400
    if score < 0 or score > 10_000_000:
        return jsonify({"error": "invalid score"}), 400
    record = _save_highscore(name, score)
    return jsonify(record), 200


@app.route("/metrics", methods=["GET"])
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "not found"}), 404


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "request too large"}), 413


@app.errorhandler(500)
def internal_error(_error):
    return jsonify({"error": "internal server error"}), 500


if __name__ == "__main__":
    # Development only. Production runs through Gunicorn in the container.
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
