from fastapi import APIRouter

from app.config import get_settings

router = APIRouter()

APP_VERSION = "0.1.0"


# FastAPI's route-method population doesn't auto-add HEAD for GET routes here
# (unlike plain Starlette), so uptime monitors that default to HEAD (e.g.
# UptimeRobot) get a 405 unless HEAD is declared explicitly.
@router.api_route("/health", methods=["GET", "HEAD"])
def get_health():
    settings = get_settings()
    return {"status": "ok", "app_name": settings.app_name, "version": APP_VERSION}
