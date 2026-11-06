"""GH-300 training for Telstra: a small, editable FastAPI demo backend.

Run with `python app.py`. Registrations are demo-only and reset on restart.
"""

import json
import os
import re
from pathlib import Path
from uuid import uuid4

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI(
    title="Telstra GH-300 Training API",
    description="Browse GitHub Copilot training topics and try demo registrations.",
)
current_dir = Path(__file__).resolve().parent
topics = json.loads((current_dir / "topics.json").read_text(encoding="utf-8"))

# Demo-only storage: registrations reset when the server restarts.
registrations = {}

app.mount("/static", StaticFiles(directory=current_dir / "public"), name="static")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    policy = "object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
    # FastAPI's interactive documentation loads its UI from a CDN.
    if request.url.path not in {"/docs", "/redoc"}:
        policy = "default-src 'self'; " + policy
    response.headers["Content-Security-Policy"] = policy
    return response


@app.exception_handler(StarletteHTTPException)
async def http_error(request: Request, error: StarletteHTTPException):
    return JSONResponse(
        status_code=error.status_code,
        content={"error": error.detail},
        headers=error.headers,
    )


@app.get("/", include_in_schema=False)
def root():
    return FileResponse(current_dir / "public" / "index.html")


@app.get("/app.js", include_in_schema=False)
def frontend_script():
    return FileResponse(current_dir / "public" / "app.js", media_type="text/javascript")


@app.get("/styles.css", include_in_schema=False)
def frontend_styles():
    return FileResponse(current_dir / "public" / "styles.css", media_type="text/css")


@app.get("/api/topics")
def get_topics():
    """View the available training topics without exposing participant details."""
    return [
        {
            **topic,
            "capacity": 30,
            "registrationCount": sum(
                registration["topicId"] == topic["id"]
                for registration in registrations.values()
            ),
        }
        for topic in topics
    ]


@app.post(
    "/api/registrations",
    status_code=201,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "required": ["name", "email", "topicId"],
                        "properties": {
                            "name": {"type": "string", "example": "Demo Learner"},
                            "email": {"type": "string", "example": "learner@example.com"},
                            "topicId": {"type": "string", "example": "copilot-fundamentals"},
                        },
                    },
                },
            },
        },
    },
)
async def register_for_topic(request: Request):
    """Register a fictional participant for one training topic."""
    if request.headers.get("content-type", "").split(";")[0].strip() != "application/json":
        raise HTTPException(status_code=415, detail="Use application/json for registrations.")

    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > 8192:
            raise HTTPException(status_code=413, detail="Registration request is too large.")
        body.extend(chunk)
    try:
        data = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Send a valid JSON registration.") from None

    if not isinstance(data, dict):
        data = {}
    name = data.get("name", "")
    email = data.get("email", "")
    name = name.strip() if isinstance(name, str) else ""
    email = email.strip().lower() if isinstance(email, str) else ""
    topic = next((item for item in topics if item["id"] == data.get("topicId")), None)
    if (
        not name
        or len(name) > 100
        or len(email) > 254
        or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email)
        or topic is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Enter a name (up to 100 characters), a valid email, and an available topic.",
        )

    registration = {"id": str(uuid4()), "name": name, "email": email, "topicId": topic["id"]}
    registrations[registration["id"]] = registration
    return {
        "registration": registration,
        "message": f"You are registered for {topic['title']}.",
    }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", "3000")), reload=True)
