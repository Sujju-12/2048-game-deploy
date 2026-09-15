import os
import time
from functools import wraps

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
