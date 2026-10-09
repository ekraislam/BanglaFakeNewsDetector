from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from .config import MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH, MAX_HEADLINE_LENGTH


class PredictRequest(BaseModel):
    content: str = Field(
        ...,
        description="The full body text of the Bangla news article to classify."
    )
    headline: Optional[str] = Field(
        None,
        description="Optional headline for display and record purposes. The trained model classifies content."
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        trimmed = v.strip() if v else ""
        if not trimmed:
            raise ValueError("News content cannot be empty or only whitespace.")
        if len(trimmed) < MIN_CONTENT_LENGTH:
            raise ValueError(f"News content is too short. Please provide at least {MIN_CONTENT_LENGTH} characters.")
        if len(trimmed) > MAX_CONTENT_LENGTH:
            raise ValueError(f"News content exceeds the maximum limit of {MAX_CONTENT_LENGTH:,} characters.")
        return trimmed

    @field_validator("headline")
    @classmethod
    def validate_headline(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            return None
        if len(trimmed) > MAX_HEADLINE_LENGTH:
            raise ValueError(f"Headline exceeds maximum limit of {MAX_HEADLINE_LENGTH} characters.")
        return trimmed


class ProbabilityItem(BaseModel):
    class_index: int
    label_name: str
    display_name: str
    display_name_bn: str
    probability: float
    percentage: float


class PredictResponse(BaseModel):
    predicted_class: int
    predicted_label: str
    display_label: str
    display_label_bn: str
    confidence: float
    confidence_percentage: float
    probabilities: Dict[str, float]
    detailed_probabilities: List[ProbabilityItem]
    headline: Optional[str] = None
    char_count: int
    word_count: int
    explanation: str
    explanation_bn: str
    disclaimer: str
    model_name: str
    model_type: str
    top_fake_indicators: List[str] = Field(default_factory=list, description="Top tokens contributing towards fake classification")
    top_authentic_indicators: List[str] = Field(default_factory=list, description="Top tokens contributing towards authentic classification")
    risk_level: str = Field(default="Moderate Assessment", description="Assessment risk or reliability level")
    risk_level_bn: str = Field(default="মাঝারি মাত্রা", description="Assessment level in Bengali")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    model_type: str
    classes: List[int]
    version: str


class MetadataResponse(BaseModel):
    model_name: str
    model_type: str
    input_feature: str
    input_expected: str
    prediction_mapping: Dict[str, str]
    training_rows: Optional[int] = None
    authentic_labelled_rows: Optional[int] = None
    fake_labelled_rows: Optional[int] = None
    training_data: Optional[str] = None
    warning: Optional[str] = None
