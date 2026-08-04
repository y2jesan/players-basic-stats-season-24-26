from fastapi import APIRouter

from app.config import get_settings

router = APIRouter()

APP_VERSION = "0.1.0"


@router.get("/health")
def get_health():
    settings = get_settings()
    return {"status": "ok", "app_name": settings.app_name, "version": APP_VERSION}
