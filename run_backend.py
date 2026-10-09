"""
Bangla Fake News Detector - Backend Launcher Script
Run this script to start the FastAPI server:
    python run_backend.py
"""
import sys
import uvicorn

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("=" * 60)
    print(" Bangla Fake News Detector Backend")
    print(" Server starting on: http://127.0.0.1:8000")
    print(" Interactive Docs:   http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
