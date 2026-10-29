from pathlib import Path
import joblib
from cleaning import clean_text, clean_spam

MODELS = Path(__file__).resolve().parent.parent / "models"
_tox = joblib.load(MODELS / "toxicity_model.joblib")
_spam = joblib.load(MODELS / "spam_model.joblib")

def predict(text):
    # 1. toxicity: one score per label
    t = clean_text(text)
    if t == "":
        return {"outcome": "allow", "flagged_labels": [], "toxicity_scores": {},
                "spam_score": 0.0, "is_spam": False}
    probs = _tox["model"].predict_proba([t])[0]
    scores = {lab: round(float(p), 3) for lab, p in zip(_tox["labels"], probs)}
    flagged = [lab for lab in scores if scores[lab] >= _tox["thresholds"][lab]]

    # 2. spam: one score
    spam_score = float(_spam["model"].predict_proba([clean_spam(text)])[0, 1])
    is_spam = spam_score >= _spam["threshold"]

    # 3. decision: the model never rejects, a human moderator decides
    outcome = "hold" if (flagged or is_spam) else "allow"

    return {"outcome": outcome, "flagged_labels": flagged, "toxicity_scores": scores,
            "spam_score": round(spam_score, 3), "is_spam": bool(is_spam)}