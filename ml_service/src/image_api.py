from fastapi import FastAPI, File, UploadFile, HTTPException
from image_predict import predict_image   # model loads once, here at startup

app = FastAPI(title="Smart Community ML Service")

ALLOWED_TYPES = {"image/jpeg", "image/png"}
MAX_BYTES = 5 * 1024 * 1024   # 5 MB


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/moderate-image")
def moderate_image(file: UploadFile = File(...)):
    # 1. Check the file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG and PNG images are allowed.")

    # 2. Read the file and check its size
    data = file.file.read(MAX_BYTES + 1)
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image is larger than 5 MB.")

    # 3. Predict (fails if the file is not a real image)
    try:
        result = predict_image(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the file as an image.")

    # 4. Tell the main app what to do
    result["action"] = "hold_for_moderator_review" if result["flag_for_review"] else "allow"
    return result