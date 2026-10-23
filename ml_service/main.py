import sys
from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).parent / "src"))   # finds predict.py and cleaning.py
from predict import predict

MODEL_VERSION = "tfidf-logreg-v2"   

app = FastAPI(title="Smart Community moderation service")

class Comment(BaseModel):
    text: str = Field(..., max_length=5000)

def moderate(text):
    r = predict(text)                                    # the model never rejects: allow or hold only
    top = max(r["toxicity_scores"].values(), default=0.0)
    is_profane = len(r["flagged_labels"]) > 0
    spam = r["spam_score"]
    return {
        "text": text,
        "spam_check": {
            "is_spam": r["is_spam"],
            "confidence": round(spam if r["is_spam"] else 1 - spam, 4),
            "spam_score": round(spam, 4),
        },
        "profanity_check": {
            "is_profane": is_profane,
            "confidence": round(top if is_profane else 1 - top, 4),
            "top_score": round(top, 4),
        },
        "outcome": r["outcome"],                         # "allow" or "hold"
        "flagged_labels": r["flagged_labels"],
        "scores": r["toxicity_scores"],
        "model_version": MODEL_VERSION,
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}

@app.post("/check-comment")       
def check_comment(c: Comment):
    return moderate(c.text)

@app.post("/predict")              
def predict_route(c: Comment):
    return moderate(c.text)