import json
from pathlib import Path
import numpy as np
import tensorflow as tf

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
model = tf.keras.models.load_model(MODEL_DIR / "image_moderation.keras")
cfg = json.loads((MODEL_DIR / "image_threshold.json").read_text())
THRESHOLD = cfg["threshold"]
IMG_SIZE = cfg["img_size"]

def predict_image(image_bytes: bytes) -> dict:
    img = tf.io.decode_image(image_bytes, channels=3, expand_animations=False)
    img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
    img = tf.expand_dims(img, 0)                      # make a batch of 1
    prob = float(model.predict(img, verbose=0)[0][0]) # probability of unsafe

    unsafe = prob >= THRESHOLD
    return {
        "label": "potentially_unsafe" if unsafe else "safe",
        "confidence": round(prob if unsafe else 1 - prob, 4),
        "unsafe_probability": round(prob, 4),
        "flag_for_review": bool(unsafe),
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python ml_service/src/image_predict.py <image_path>")
    else:
        with open(sys.argv[1], "rb") as f:
            print(predict_image(f.read()))


