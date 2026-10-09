import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import CORS_ORIGINS
from .model_service import ModelService
from .schemas import PredictRequest, PredictResponse, HealthResponse, MetadataResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bangla_fake_news_detector")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Loads the trained model once during application startup.
    Ensures memory efficiency and validates model availability immediately.
    """
    logger.info("Initializing Bangla Fake News Detector API...")
    try:
        service = ModelService.get_instance()
        service.load_model()
        logger.info("Trained model initialized successfully.")
    except Exception as e:
        logger.critical("Model initialization failed: %s", e)
        # Note: We do not exit process so health check can accurately report degraded status
    yield
    logger.info("Shutting down Bangla Fake News Detector API.")


app = FastAPI(
    title="Bangla Fake News Detector API",
    description="Research-grade REST API for classifying Bangla news articles using trained TF-IDF and Logistic Regression model.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for request validation errors, providing clear, sanitized messages.
    """
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        errors.append(f"{field}: {msg}")
    
    clean_message = "; ".join(errors) if errors else "Invalid request data."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "error": "Validation Error",
            "detail": clean_message
        }
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """
    Handler for explicit ValueError exceptions.
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Bad Request",
            "detail": str(exc)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler ensuring no sensitive server paths or stack traces are leaked to clients.
    """
    logger.error("Unhandled exception during request processing: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred while processing the news article. Please try again later."
        }
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    System health check returning the model loading state and version.
    """
    service = ModelService.get_instance()
    is_ready = service.is_loaded

    return HealthResponse(
        status="ok" if is_ready else "degraded",
        model_loaded=is_ready,
        model_name=service.metadata.get("model_name", "Bangla News Text Classifier"),
        model_type=service.metadata.get("model_type", "TF-IDF + Logistic Regression"),
        classes=service.classes,
        version="1.0.0"
    )


@app.get("/metadata", response_model=MetadataResponse, tags=["Model"])
async def get_metadata():
    """
    Returns full metadata for the trained model.
    """
    service = ModelService.get_instance()
    if not service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not yet initialized."
        )
    return service.get_metadata()


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
async def predict_news(payload: PredictRequest):
    """
    Classifies a news article using the loaded scikit-learn model.
    Validates input and returns the predicted label, probability distribution, and academic disclaimer.
    """
    service = ModelService.get_instance()
    if not service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Classifier model is not ready. Please verify that the model file is accessible."
        )

    try:
        result = service.predict(content=payload.content, headline=payload.headline)
        return result
    except Exception as e:
        logger.error("Prediction failure: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference failed for the provided news text."
        )
