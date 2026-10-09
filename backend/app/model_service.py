import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib

from .config import MODEL_FILE_PATH, METADATA_FILE_PATH
from .schemas import PredictResponse, ProbabilityItem, MetadataResponse

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "This tool predicts labels learned from its training datasets. It does not independently verify "
    "whether a news article is true or false. Predictions may be wrong, especially for unfamiliar sources or topics."
)

DEFAULT_METADATA = {
    "model_name": "Bangla News Text Classifier",
    "model_type": "TF-IDF + Logistic Regression",
    "input_feature": "content_only",
    "input_expected": "Bangla news article content as text",
    "prediction_mapping": {
        "0": "authentic_label",
        "1": "fake_label"
    },
    "training_rows": 51752,
    "authentic_labelled_rows": 48820,
    "fake_labelled_rows": 2932,
    "training_data": "binary_candidate_no_known_label_conflicts.csv",
    "warning": DISCLAIMER_TEXT
}


class ModelService:
    _instance: Optional["ModelService"] = None

    def __init__(self):
        self.model: Any = None
        self.metadata: Dict[str, Any] = {}
        self.classes: List[int] = []
        self.is_loaded: bool = False
        self.prediction_mapping: Dict[int, str] = {}

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load_model(self) -> None:
        """
        Loads the trained scikit-learn model artifact and metadata file.
        Fails with clear diagnostic messages if files are missing or invalid.
        Never mocks or silently replaces with a fake model.
        """
        if self.is_loaded:
            logger.info("Model already loaded into memory.")
            return

        # 1. Verify and load model metadata
        if not METADATA_FILE_PATH.is_file():
            logger.warning(
                "Metadata file not found at '%s'. Using built-in default metadata specification.",
                METADATA_FILE_PATH
            )
            self.metadata = DEFAULT_METADATA
        else:
            try:
                with open(METADATA_FILE_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                logger.info("Metadata loaded successfully from '%s'.", METADATA_FILE_PATH)
            except Exception as e:
                logger.error("Failed to parse metadata file '%s': %s", METADATA_FILE_PATH, e)
                raise RuntimeError(
                    f"Failed to parse model metadata JSON: {e}"
                ) from e

        # 2. Verify model file existence
        if not MODEL_FILE_PATH.is_file():
            raise FileNotFoundError(
                f"Trained model artifact '{MODEL_FILE_PATH.name}' not found. "
                f"Searched location: {MODEL_FILE_PATH.resolve()}. "
                "Please place the trained 'bangla_news_text_model.joblib' file in the project directory."
            )

        # 3. Load model artifact
        try:
            logger.info("Loading model from '%s'...", MODEL_FILE_PATH)
            self.model = joblib.load(MODEL_FILE_PATH)
        except Exception as e:
            raise RuntimeError(
                f"Failed to load scikit-learn model artifact: {e}. "
                "Ensure required dependencies (scikit-learn, joblib) are compatible."
            ) from e

        # 4. Verify model structure
        if not hasattr(self.model, "predict"):
            raise TypeError("Loaded artifact does not implement scikit-learn 'predict' method.")

        if hasattr(self.model, "classes_"):
            self.classes = [int(c) for c in self.model.classes_]
        else:
            self.classes = [0, 1]

        # 5. Build prediction mapping
        raw_map = self.metadata.get("prediction_mapping", {"0": "authentic_label", "1": "fake_label"})
        self.prediction_mapping = {int(k): str(v) for k, v in raw_map.items()}

        self.is_loaded = True
        logger.info(
            "Model loaded successfully. Classes: %s, Mapping: %s",
            self.classes,
            self.prediction_mapping
        )

    def predict(self, content: str, headline: Optional[str] = None) -> PredictResponse:
        """
        Executes inference on the provided Bangla news content string.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded. Please ensure the backend initialized properly.")

        # The model's TF-IDF vectorizer accepts an iterable of strings
        # Note: Model is trained on content only (as defined in metadata: 'input_feature': 'content_only')
        input_data = [content]

        try:
            preds = self.model.predict(input_data)
            predicted_class = int(preds[0])
        except Exception as e:
            raise RuntimeError(f"Error during model prediction: {e}") from e

        # Determine probabilities if model supports predict_proba
        probabilities_dict: Dict[str, float] = {}
        detailed_probs: List[ProbabilityItem] = []
        confidence: float = 0.5

        if hasattr(self.model, "predict_proba"):
            try:
                probas = self.model.predict_proba(input_data)[0]
                for idx, cls_val in enumerate(self.classes):
                    prob_val = float(probas[idx])
                    label_name = self.prediction_mapping.get(cls_val, f"class_{cls_val}")
                    probabilities_dict[label_name] = round(prob_val, 4)

                    is_authentic = (cls_val == 0)
                    display_name = "Authentic News Pattern" if is_authentic else "Fake / Suspicious Pattern"
                    display_name_bn = "নির্ভরযোগ্য সংবাদ প্যাটার্ন" if is_authentic else "ভুয়া / সন্দেহজনক প্যাটার্ন"

                    detailed_probs.append(
                        ProbabilityItem(
                            class_index=cls_val,
                            label_name=label_name,
                            display_name=display_name,
                            display_name_bn=display_name_bn,
                            probability=round(prob_val, 4),
                            percentage=round(prob_val * 100, 1)
                        )
                    )

                # Confidence is the probability of the predicted class
                if predicted_class in self.classes:
                    pred_idx = self.classes.index(predicted_class)
                    confidence = float(probas[pred_idx])
            except Exception as e:
                logger.warning("Could not calculate probabilities: %s", e)

        # Labels and display titles
        predicted_label = self.prediction_mapping.get(predicted_class, f"class_{predicted_class}")
        is_authentic = (predicted_class == 0)

        display_label = "Authentic / Reliable" if is_authentic else "Fake / Misleading Pattern"
        display_label_bn = "নির্ভরযোগ্য সংবাদ প্যাটার্ন" if is_authentic else "ভুয়া / অসত্য সংবাদের প্যাটার্ন"

        conf_pct = round(confidence * 100, 1)

        # Generate explanatory texts
        if is_authentic:
            explanation = (
                f"The model classified this article as matching the '{predicted_label}' distribution "
                f"with an estimated confidence score of {conf_pct}%. In the training dataset, this profile "
                f"corresponds to standard editorial journalism patterns in mainstream Bangla publications."
            )
            explanation_bn = (
                f"মডেলটি এই সংবাদের ভাষাগত বৈশিষ্ট্য ও শব্দবিন্যাস বিশ্লেষণ করে {conf_pct}% আত্মবিশ্বাসের সাথে "
                f"'{display_label_bn}' হিসেবে শ্রেণীবদ্ধ করেছে। প্রশিক্ষণ ডেটাসেটের মূলধারার নির্ভরযোগ্য সংবাদমাধ্যমের "
                f"সাথে এর কাঠামোগত মিল পরিলক্ষিত হয়েছে।"
            )
        else:
            explanation = (
                f"The model classified this article as matching the '{predicted_label}' distribution "
                f"with an estimated confidence score of {conf_pct}%. In the training dataset, this profile "
                f"corresponds to clickbait, sensationalized, satire, or fabricated news vocabulary patterns."
            )
            explanation_bn = (
                f"মডেলটি এই সংবাদের শব্দমালা ও শৈলী বিশ্লেষণ করে {conf_pct}% আত্মবিশ্বাসের সাথে "
                f"'{display_label_bn}' হিসেবে চিহ্নিত করেছে। প্রশিক্ষণ ডেটাসেটের চাঞ্চল্যকর, অতিরঞ্জিত বা অসত্য "
                f"সংবাদের শব্দবিন্যাসের সাথে এর মিল রয়েছে।"
            )

        char_count = len(content)
        word_count = len(content.split())

        # Compute Risk / Reliability Level
        if is_authentic:
            if confidence >= 0.75:
                risk_level = "High Editorial Authenticity"
                risk_level_bn = "উচ্চ নির্ভরযোগ্যতা ও মূলধারার সংবাদ শৈলী"
            elif confidence >= 0.58:
                risk_level = "Moderate Editorial Authenticity"
                risk_level_bn = "মাঝারি নির্ভরযোগ্যতার প্যাটার্ন"
            else:
                risk_level = "Borderline / Neutral Style"
                risk_level_bn = "প্রান্তিক বা মিশ্র সংবাদ শৈলী"
        else:
            if confidence >= 0.75:
                risk_level = "High Misinformation Risk"
                risk_level_bn = "উচ্চ মাত্রার অসঙ্গতি ও চটুল/রম্য শৈলী"
            elif confidence >= 0.58:
                risk_level = "Moderate Misinformation Risk"
                risk_level_bn = "মাঝারি মাত্রার অসঙ্গতি ও সন্দেহজনক শৈলী"
            else:
                risk_level = "Borderline / Ambiguous Style"
                risk_level_bn = "প্রান্তিক বা মিশ্র সংবাদের প্যাটার্ন"

        # Extract top influencing vocabulary markers mapped to genuine words in article
        top_fake_indicators: List[str] = []
        top_authentic_indicators: List[str] = []
        try:
            import re
            user_real_words = [w for w in re.findall(r'[\u0980-\u09FF\w]+', content) if len(w) >= 3]

            if hasattr(self.model, "named_steps") and "tfidf" in self.model.named_steps and "classifier" in self.model.named_steps:
                vec = self.model.named_steps["tfidf"]
                clf = self.model.named_steps["classifier"]
                if hasattr(clf, "coef_"):
                    x_tfidf = vec.transform([content])
                    feature_names = vec.get_feature_names_out()
                    coefs = clf.coef_[0]
                    _, cols = x_tfidf.nonzero()
                    scored_features = []
                    for c in cols:
                        score = float(x_tfidf[0, c] * coefs[c])
                        raw_feat = str(feature_names[c]).strip()
                        scored_features.append((raw_feat, score))

                    def extract_clean_word_list(features, min_length=3):
                        matched_words = []
                        seen = set()
                        for feat, sc in features:
                            feat_compact = feat.replace(" ", "")
                            # 1. Match against actual words in user text
                            found_in_text = False
                            for real_w in user_real_words:
                                if (feat_compact in real_w or real_w in feat_compact) and len(real_w) >= min_length and real_w not in seen:
                                    matched_words.append(real_w)
                                    seen.add(real_w)
                                    found_in_text = True
                                    break
                            # 2. Or fallback to full feature token if >= 4 chars
                            if not found_in_text and len(feat) >= 4 and " " not in feat and feat not in seen:
                                matched_words.append(feat)
                                seen.add(feat)
                            if len(matched_words) >= 6:
                                break
                        return matched_words

                    pos_feats = [item for item in sorted(scored_features, key=lambda x: x[1], reverse=True) if item[1] > 0]
                    neg_feats = [item for item in sorted(scored_features, key=lambda x: x[1]) if item[1] < 0]
                    top_fake_indicators = extract_clean_word_list(pos_feats)
                    top_authentic_indicators = extract_clean_word_list(neg_feats)
        except Exception as e:
            logger.debug("Keyword extraction optional step bypassed: %s", e)

        return PredictResponse(
            predicted_class=predicted_class,
            predicted_label=predicted_label,
            display_label=display_label,
            display_label_bn=display_label_bn,
            confidence=round(confidence, 4),
            confidence_percentage=conf_pct,
            probabilities=probabilities_dict,
            detailed_probabilities=detailed_probs,
            headline=headline,
            char_count=char_count,
            word_count=word_count,
            explanation=explanation,
            explanation_bn=explanation_bn,
            disclaimer=DISCLAIMER_TEXT,
            model_name=self.metadata.get("model_name", "Bangla News Text Classifier"),
            model_type=self.metadata.get("model_type", "TF-IDF + Logistic Regression"),
            top_fake_indicators=top_fake_indicators,
            top_authentic_indicators=top_authentic_indicators,
            risk_level=risk_level,
            risk_level_bn=risk_level_bn
        )

    def get_metadata(self) -> MetadataResponse:
        return MetadataResponse(
            model_name=self.metadata.get("model_name", "Bangla News Text Classifier"),
            model_type=self.metadata.get("model_type", "TF-IDF + Logistic Regression"),
            input_feature=self.metadata.get("input_feature", "content_only"),
            input_expected=self.metadata.get("input_expected", "Bangla news article content as text"),
            prediction_mapping=self.metadata.get("prediction_mapping", {"0": "authentic_label", "1": "fake_label"}),
            training_rows=self.metadata.get("training_rows"),
            authentic_labelled_rows=self.metadata.get("authentic_labelled_rows"),
            fake_labelled_rows=self.metadata.get("fake_labelled_rows"),
            training_data=self.metadata.get("training_data"),
            warning=self.metadata.get("warning", DISCLAIMER_TEXT)
        )
