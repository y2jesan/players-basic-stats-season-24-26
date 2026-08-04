from datetime import UTC, datetime

from fastapi import APIRouter

from app.api.routes.health import APP_VERSION
from app.config import get_settings

router = APIRouter()


@router.get("/hello")
def get_hello():
    settings = get_settings()
    return {
        "greeting": f"Welcome to {settings.app_name}",
        "server_time_utc": datetime.now(UTC).isoformat(),
        "app_name": settings.app_name,
        "version": APP_VERSION,
    }
