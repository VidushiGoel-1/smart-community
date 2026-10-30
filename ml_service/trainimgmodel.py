import json
from pathlib import Path
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_curve

DATA_DIR = Path(r"C:\projects\smart-community\data\harmful-contents")
OUT_DIR = Path(r"C:\projects\smart-community\ml_service\models")
OUT_DIR.mkdir(parents=True, exist_ok=True)

cat_cols = ["alcohol", "drugs", "weapons", "gambling",
            "nudity", "sexy", "smoking", "violence"]
IMG_SIZE = 160      # smaller = faster on CPU (use 224 if you have time)
BATCH = 32
EPOCHS = 5

# 1. Load CSVs and make the two-class label
def load(split):
    df = pd.read_csv(DATA_DIR / "csv" / f"{split}.csv")
    df["unsafe"] = (df[cat_cols].sum(axis=1) > 0).astype(int)
    df["path"] = df["name"].apply(lambda n: str(DATA_DIR / "data" / split / n))
    return df

train, val, test = load("train"), load("val"), load("test")

# 2. Build the input pipeline (reads, resizes and batches images)
def read_image(path, label):
    img = tf.io.decode_image(tf.io.read_file(path), channels=3, expand_animations=False)
    img.set_shape([None, None, 3])
    img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
    return img, tf.cast(label, tf.float32)

def make_ds(df, shuffle=False):
    ds = tf.data.Dataset.from_tensor_slices((df["path"].values, df["unsafe"].values))
    if shuffle:
        ds = ds.shuffle(len(df), seed=42)
    return ds.map(read_image, num_parallel_calls=tf.data.AUTOTUNE).batch(BATCH).prefetch(tf.data.AUTOTUNE)

train_ds, val_ds, test_ds = make_ds(train, True), make_ds(val), make_ds(test)

# 3. Model: pretrained MobileNetV2 (frozen) + small classifier head
base = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet")
base.trainable = False

augment = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.05),
])

inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x = augment(inputs)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base(x, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.2)(x)
outputs = tf.keras.layers.Dense(1, activation="sigmoid")(x)
model = tf.keras.Model(inputs, outputs)

model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
              loss="binary_crossentropy", metrics=["accuracy"])

# 4. Train
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS)

# 5. Pick the threshold on VALIDATION data (best F1)
val_prob = model.predict(val_ds).ravel()
val_true = val["unsafe"].values
prec, rec, thr = precision_recall_curve(val_true, val_prob)
f1 = 2 * prec * rec / (prec + rec + 1e-9)
best_thr = float(thr[np.argmax(f1[:-1])])
print("Chosen threshold:", best_thr)

# 6. Evaluate ONCE on the test set
test_prob = model.predict(test_ds).ravel()
test_pred = (test_prob >= best_thr).astype(int)
print(classification_report(test["unsafe"].values, test_pred,
                            target_names=["safe", "potentially_unsafe"]))
print(confusion_matrix(test["unsafe"].values, test_pred))

# 7. Save model + settings
model.save(OUT_DIR / "image_moderation.keras")
with open(OUT_DIR / "image_threshold.json", "w") as f:
    json.dump({"threshold": best_thr, "img_size": IMG_SIZE,
               "classes": {"0": "safe", "1": "potentially_unsafe"}}, f)
print("Saved to", OUT_DIR)

# Fine-tune the top layers
base.trainable = True
for layer in base.layers[:-30]:
    layer.trainable = False

model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
              loss="binary_crossentropy", metrics=["accuracy"])
model.fit(train_ds, validation_data=val_ds, epochs=5)