import os
from pathlib import Path
from typing import List

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = BASE_DIR.parent

def find_file(filename: str, env_var: str) -> Path:
    """
    Search for a file in environment variable, root workspace, cwd, or backend directory.
    """
    # 1. Environment variable
    env_val = os.getenv(env_var)
    if env_val:
        p = Path(env_val).resolve()
        if p.is_file():
            return p

    # 2. Workspace root
    root_file = WORKSPACE_ROOT / filename
    if root_file.is_file():
        return root_file

    # 3. Current working directory
    cwd_file = Path.cwd() / filename
    if cwd_file.is_file():
        return cwd_file

    # 4. Backend directory
    backend_file = BASE_DIR / filename
    if backend_file.is_file():
        return backend_file

    # Fallback to workspace root path for clear error messages
    return root_file

MODEL_FILE_PATH = find_file("bangla_news_text_model.joblib", "MODEL_PATH")
METADATA_FILE_PATH = find_file("model_metadata.json", "METADATA_PATH")

# Text validation constraints
MIN_CONTENT_LENGTH: int = 5
MAX_CONTENT_LENGTH: int = 100_000
MAX_HEADLINE_LENGTH: int = 500

# CORS origins
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"
]
