import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.model_service import DISCLAIMER_TEXT


@pytest.fixture(scope="module")
def client():
    """
    TestClient context manager ensures FastAPI's lifespan runs and loads the model.
    """
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    """
    Verifies that /health responds with 200 and confirms the trained model is loaded.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert "Bangla" in data["model_name"]
    assert data["classes"] == [0, 1]


def test_metadata_endpoint(client):
    """
    Verifies that /metadata exposes the training setup and prediction mapping.
    """
    response = client.get("/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "Bangla News Text Classifier"
    assert data["input_feature"] == "content_only"
    assert data["prediction_mapping"] == {"0": "authentic_label", "1": "fake_label"}


def test_predict_authentic_sample(client):
    """
    Tests prediction on a typical Bangla news paragraph.
    """
    payload = {
        "headline": "ঢাকায় জাতীয় সংসদে বাজেট অধিবেশন শুরু",
        "content": "আজ জাতীয় সংসদে স্পিকারের সভাপতিত্বে নতুন অর্থবছরের বাজেট অধিবেশন শুরু হয়েছে। অর্থমন্ত্রী বিস্তারিত প্রস্তাবনা উপস্থাপন করবেন বলে সংশ্লিষ্ট কর্মকর্তারা জানিয়েছেন।"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["predicted_class"] in [0, 1]
    assert data["predicted_label"] in ["authentic_label", "fake_label"]
    assert 0.0 <= data["confidence"] <= 1.0
    assert "probabilities" in data
    assert "authentic_label" in data["probabilities"]
    assert "fake_label" in data["probabilities"]

    # Verify probabilities sum to approximately 1.0
    total_prob = data["probabilities"]["authentic_label"] + data["probabilities"]["fake_label"]
    assert abs(total_prob - 1.0) < 0.01

    assert data["headline"] == payload["headline"]
    assert data["char_count"] > 0
    assert data["word_count"] > 0
    assert len(data["explanation"]) > 0
    assert len(data["explanation_bn"]) > 0
    assert data["disclaimer"] == DISCLAIMER_TEXT


def test_predict_without_headline(client):
    """
    Verifies that headline is purely optional and prediction succeeds without it.
    """
    payload = {
        "content": "বাংলাদেশ ব্যাংকের গভর্নর আজ আর্থিক খাতের সংস্কার ও মূল্যস্ফীতি নিয়ন্ত্রণ নিয়ে বিশেষ বৈঠক করেছেন।"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["headline"] is None
    assert data["predicted_class"] in [0, 1]


def test_predict_empty_content_validation(client):
    """
    Verifies that empty content returns a 422 Unprocessable Entity error.
    """
    payload = {"content": ""}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "error" in data


def test_predict_whitespace_content_validation(client):
    """
    Verifies that whitespace-only content is rejected with a 422 status code.
    """
    payload = {"content": "     \n\t   "}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_too_short_content_validation(client):
    """
    Verifies that content below minimum threshold is rejected.
    """
    payload = {"content": "হাই"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_excessively_long_content_validation(client):
    """
    Verifies that content exceeding maximum threshold (100,000 characters) is rejected.
    """
    payload = {"content": "সংবাদ " * 25000}  # ~175,000 chars
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
