"""
Multilingual Sentiment Analysis Microservice
Uses TextBlob for English and TextBlob's built-in translation for other languages.
Supported: english, urdu, hindi, bangali, pashto, chinese, french, german,
           italian, japanese, korean, russian, spanish, swedish, turkish
"""

from contextlib import asynccontextmanager
from enum import Enum
from typing import Optional

import spacy
from fastapi import FastAPI
from langdetect import DetectorFactory, detect
from pydantic import BaseModel, Field
from spacytextblob.spacytextblob import SpacyTextBlob
from textblob import TextBlob

# Make langdetect deterministic
DetectorFactory.seed = 0

SUPPORTED_LANGUAGES = {
    "en": "english",
    "ur": "urdu",
    "hi": "hindi",
    "bn": "bangali",
    "ps": "pashto",
    "zh-cn": "chinese",
    "fr": "french",
    "de": "german",
    "it": "italian",
    "ja": "japanese",
    "ko": "korean",
    "ru": "russian",
    "es": "spanish",
    "sv": "swedish",
    "tr": "turkish",
}

LANGUAGE_NAME_TO_CODE = {v: k for k, v in SUPPORTED_LANGUAGES.items()}

nlp = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load spaCy model and add TextBlob pipe on startup."""
    global nlp
    try:
        nlp = spacy.load("en_core_web_sm")
        nlp.add_pipe("spacytextblob")
    except OSError:
        print(
            "WARNING: spaCy model 'en_core_web_sm' not found. "
            "Run: python -m spacy download en_core_web_sm"
        )
        nlp = None
    yield


app = FastAPI(
    title="Multilingual Sentiment Analysis API",
    description="Analyzes sentiment of text in multiple languages using TextBlob and spaCy.",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SentimentLabel(str, Enum):
    positive = "positive"
    negative = "negative"
    neutral = "neutral"


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    language: Optional[str] = Field(None, description="ISO code or language name. Auto-detected if omitted.")


class SentimentResponse(BaseModel):
    score: float = Field(..., ge=-1.0, le=1.0)
    label: SentimentLabel
    language: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class BatchRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=100)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_language(raw: Optional[str], text: str) -> str:
    if raw:
        lower = raw.lower().strip()
        if lower in LANGUAGE_NAME_TO_CODE:
            return LANGUAGE_NAME_TO_CODE[lower]
        if lower in SUPPORTED_LANGUAGES:
            return lower
        return lower
    try:
        return detect(text)
    except Exception:
        return "en"


def _score_to_label(score: float) -> SentimentLabel:
    if score > 0.1:
        return SentimentLabel.positive
    if score < -0.1:
        return SentimentLabel.negative
    return SentimentLabel.neutral


def _analyze_single(text: str, language: Optional[str] = None) -> dict:
    lang_code = _resolve_language(language, text)

    try:
        if lang_code == "en":
            if nlp is not None:
                doc = nlp(text)
                polarity = doc._.blob.polarity
                subjectivity = doc._.blob.subjectivity
            else:
                blob = TextBlob(text)
                polarity = blob.sentiment.polarity
                subjectivity = blob.sentiment.subjectivity
        else:
            blob = TextBlob(text)
            try:
                translated = blob.translate(from_lang=lang_code, to="en")
                polarity = translated.sentiment.polarity
                subjectivity = translated.sentiment.subjectivity
            except Exception:
                polarity = blob.sentiment.polarity
                subjectivity = blob.sentiment.subjectivity

        confidence = round(min(max(abs(polarity) * 0.6 + subjectivity * 0.4, 0.0), 1.0), 4)
        polarity = round(polarity, 4)

        return {
            "score": polarity,
            "label": _score_to_label(polarity).value,
            "language": SUPPORTED_LANGUAGES.get(lang_code, lang_code),
            "confidence": confidence,
        }
    except Exception:
        return {
            "score": 0.0,
            "label": "neutral",
            "language": SUPPORTED_LANGUAGES.get(lang_code, lang_code),
            "confidence": 0.0,
        }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Analyze sentiment of a single text."""
    return _analyze_single(req.text, req.language)


@app.post("/analyze-batch")
async def analyze_batch(req: BatchRequest):
    """Analyze sentiment of multiple texts at once."""
    return [_analyze_single(text) for text in req.texts]


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "spacy_loaded": nlp is not None,
        "supported_languages": list(SUPPORTED_LANGUAGES.values()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
