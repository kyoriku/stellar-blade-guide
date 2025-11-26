# # import os
# # import re
# # import json

# # # === CONFIG ===
# # IMAGE_DIR = "../client/public/assets/images/Eidos_7/2-ParkingTower"
# # JSON_FILE = "seed-data/collectibles/eidos-7/parking-tower.json"

# # # === HELPERS ===
# # def sanitize_filename(text):
# #     text = text.replace(" ", "_")
# #     text = re.sub(r"[''\":!?.,()\\[\\]-]", "", text)
# #     return text

# # def build_expected_name(item, image_index):
# #     order = item["display_order"]
    
# #     # Get first type from the list
# #     first_type = item["types"][0] if item["types"] else "Unknown"
# #     type_clean = sanitize_filename(first_type)
    
# #     title_clean = sanitize_filename(item["title"])
# #     filename = f"{order}_{type_clean}"
# #     if title_clean and title_clean != type_clean:
# #         filename += f"_{title_clean}"
# #     filename += f"_{image_index}.jpg"
# #     return filename

# # def rename_images():
# #     with open(JSON_FILE, "r", encoding="utf-8") as f:
# #         data = json.load(f)

# #     all_files = os.listdir(IMAGE_DIR)

# #     for item in data:
# #         for image in item["images"]:
# #             order = item["display_order"]
# #             image_index = image["order"]
# #             new_name = build_expected_name(item, image_index)

# #             # Try to match either ".{index}.jpg" or just ".jpg" (no suffix)
# #             pattern_with_index = re.compile(rf"^{order}-.+\.{image_index}\.jpg$", re.IGNORECASE)
# #             pattern_no_index = re.compile(rf"^{order}-.+\.jpg$", re.IGNORECASE)

# #             # Prefer exact match with index if it exists
# #             matches = [f for f in all_files if pattern_with_index.match(f)]
# #             if not matches:
# #                 matches = [f for f in all_files if pattern_no_index.match(f)]

# #             if not matches:
# #                 print(f"⚠️ Could not find match for order {order} (index {image_index})")
# #                 continue

# #             old_name = matches.pop(0)
# #             old_path = os.path.join(IMAGE_DIR, old_name)
# #             new_path = os.path.join(IMAGE_DIR, new_name)

# #             os.rename(old_path, new_path)
# #             all_files.remove(old_name)
# #             print(f"✅ Renamed: {old_name} → {new_name}")

# # if __name__ == "__main__":
# #     rename_images()

# import os
# import re
# import json

# # === CONFIG ===
# IMAGE_DIR = "../client/public/assets/images/Eidos_7/Abandoned-Station"
# JSON_FILE = "seed-data/collectibles/eidos-7/abandoned-station.json"

# # === HELPERS ===
# def normalize_filename(filename):
#     """
#     Convert filename to clean format:
#     - Replace spaces, periods, hyphens with underscores
#     - Remove special characters like apostrophes, quotes, colons, etc.
#     - Keep the .jpg extension
#     """
#     # Split filename and extension
#     name, ext = os.path.splitext(filename)
    
#     # Replace spaces, periods, hyphens with underscores
#     name = name.replace(" ", "_").replace(".", "_").replace("-", "_")
    
#     # Remove special characters
#     name = re.sub(r"[''\":!?.,()\\[\]']", "", name)
    
#     # Return with original extension
#     return name + ext

# def rename_images():
#     # Get all JPG files in directory
#     all_files = [f for f in os.listdir(IMAGE_DIR) if f.lower().endswith('.jpg')]
    
#     print(f"Found {len(all_files)} images in {IMAGE_DIR}\n")
    
#     renamed_count = 0
#     skipped_count = 0
    
#     for old_name in all_files:
#         new_name = normalize_filename(old_name)
        
#         # Skip if no change needed
#         if old_name == new_name:
#             print(f"[SKIP] {old_name} (already normalized)")
#             skipped_count += 1
#             continue
        
#         old_path = os.path.join(IMAGE_DIR, old_name)
#         new_path = os.path.join(IMAGE_DIR, new_name)
        
#         # Check if target filename already exists
#         if os.path.exists(new_path):
#             print(f"\033[31m[ERROR] {new_name} already exists, skipping {old_name}\033[0m")
#             continue
        
#         os.rename(old_path, new_path)
#         renamed_count += 1
#         print(f"\033[32m[OK] {old_name}\033[0m")
#         print(f"     -> {new_name}")
    
#     print(f"\n{'='*60}")
#     print(f"Summary: {renamed_count} renamed, {skipped_count} skipped")
#     print(f"{'='*60}")

# if __name__ == "__main__":
#     rename_images()

import os
import re
import json

# === CONFIG ===
IMAGE_DIR = "../client/public/assets/images/Xion/Xion"
JSON_FILE = "seed-data/collectibles/xion/xion.json"

# === HELPERS ===
def normalize_filename(filename):
    name, ext = os.path.splitext(filename)

    # Remove possessive ’s or 's
    name = re.sub(r"[’']s\b", "", name)

    # Replace ANY non-alphanumeric characters with a single underscore
    name = re.sub(r"[^a-zA-Z0-9]+", "_", name)

    # Remove leading / trailing underscores
    name = name.strip("_")

    return name + ext



def rename_images():
    # Get all JPG files in directory
    all_files = [f for f in os.listdir(IMAGE_DIR) if f.lower().endswith('.jpg')]

    print(f"Found {len(all_files)} images in {IMAGE_DIR}\n")

    renamed_count = 0
    skipped_count = 0

    for old_name in all_files:
        new_name = normalize_filename(old_name)

        # Skip if no change needed
        if old_name == new_name:
            print(f"[SKIP] {old_name} (already normalized)")
            skipped_count += 1
            continue

        old_path = os.path.join(IMAGE_DIR, old_name)
        new_path = os.path.join(IMAGE_DIR, new_name)

        # Check if target filename already exists
        if os.path.exists(new_path):
            print(f"\033[31m[ERROR] {new_name} already exists, skipping {old_name}\033[0m")
            continue

        os.rename(old_path, new_path)
        renamed_count += 1
        print(f"\033[32m[OK] {old_name}\033[0m")
        print(f"     -> {new_name}")

    print(f"\n{'='*60}")
    print(f"Summary: {renamed_count} renamed, {skipped_count} skipped")
    print(f"{'='*60}")


if __name__ == "__main__":
    rename_images()
