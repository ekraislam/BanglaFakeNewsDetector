# Root app proxy for backward compatibility when running uvicorn from root directory
from backend.app.main import app

__all__ = ["app"]
