import os
import re
import json

# === CONFIG ===
# Adjust this path to point to your local folder containing the images
IMAGE_DIR = "../client/public/assets/images/Eidos_7/3-AbandonedStation"
# Optional: Path to the cleaned JSON file (if you want to use it to drive renames)
JSON_FILE = "seed-data/Eidos-7/Abandoned-Station.json"

# === HELPERS ===
def sanitize_filename(text):
    text = text.replace(" ", "_")
    text = re.sub(r"[’'\":!?.,()\\[\\]-]", "", text)
    return text

def build_expected_name(item, image_index):
    order = item["display_order"]
    type_clean = sanitize_filename(item["types"])
    title_clean = sanitize_filename(item["title"])
    filename = f"{order}_{type_clean}"
    if title_clean and title_clean != type_clean:
        filename += f"_{title_clean}"
    filename += f"_{image_index}.jpg"
    return filename

def rename_images():
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_files = os.listdir(IMAGE_DIR)

    for item in data:
        for image in item["images"]:
            order = item["display_order"]
            image_index = image["order"]
            new_name = build_expected_name(item, image_index)

            # Try to match either ".{index}.jpg" or just ".jpg" (no suffix)
            pattern_with_index = re.compile(rf"^{order}-.+\.{image_index}\.jpg$", re.IGNORECASE)
            pattern_no_index = re.compile(rf"^{order}-.+\.jpg$", re.IGNORECASE)

            # Prefer exact match with index if it exists
            matches = [f for f in all_files if pattern_with_index.match(f)]
            if not matches:
                matches = [f for f in all_files if pattern_no_index.match(f)]

            if not matches:
                print(f"⚠️ Could not find match for order {order} (index {image_index})")
                continue

            old_name = matches.pop(0)
            old_path = os.path.join(IMAGE_DIR, old_name)
            new_path = os.path.join(IMAGE_DIR, new_name)

            os.rename(old_path, new_path)
            all_files.remove(old_name)
            print(f"✅ Renamed: {old_name} → {new_name}")

if __name__ == "__main__":
    rename_images()