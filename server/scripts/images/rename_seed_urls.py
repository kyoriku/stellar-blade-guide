# # import os
# # import re
# # import json

# # # === CONFIG ===
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

# # def update_json_urls():
# #     with open(JSON_FILE, "r", encoding="utf-8") as f:
# #         data = json.load(f)

# #     updated_count = 0

# #     # Update each image URL
# #     for item in data:
# #         for image in item["images"]:
# #             order = item["display_order"]
# #             image_index = image["order"]
            
# #             # Build the new filename
# #             new_filename = build_expected_name(item, image_index)
            
# #             # Update the URL
# #             old_url = image["url"]
# #             new_url = f"/assets/images/Eidos_7/Parking_Tower/{new_filename}"
            
# #             image["url"] = new_url
# #             updated_count += 1
# #             print(f"\033[32m[OK]\033[0m {old_url}")
# #             print(f"     \033[32m->\033[0m {new_url}")

# #     # Write back to file
# #     with open(JSON_FILE, "w", encoding="utf-8") as f:
# #         json.dump(data, f, indent=2, ensure_ascii=False)
    
# #     print(f"\n\033[32m[OK] Updated {updated_count} URLs in {JSON_FILE}\033[0m")

# # if __name__ == "__main__":
# #     update_json_urls()

# import os
# import re
# import json

# # === CONFIG ===
# JSON_FILE = "seed-data/collectibles/eidos-7/parking-tower.json"
# IMAGE_DIR = "../client/public/assets/images/Eidos_7/Parking_Tower"

# # === HELPERS ===
# def normalize_filename(filename):
#     """Match the normalization from rename_images.py"""
#     name, ext = os.path.splitext(filename)
#     name = name.replace(" ", "_").replace(".", "_").replace("-", "_")
#     name = re.sub(r"[''\":!?.,()\\[\]']", "", name)
#     return name + ext

# def update_json_urls():
#     with open(JSON_FILE, "r", encoding="utf-8") as f:
#         data = json.load(f)

#     # Get actual filenames from directory
#     actual_files = {f for f in os.listdir(IMAGE_DIR) if f.lower().endswith('.jpg')}
    
#     updated_count = 0
#     missing_count = 0

#     # Update each image URL
#     for item in data:
#         for image in item["images"]:
#             old_url = image["url"]
            
#             # Extract the old filename from the URL
#             old_filename = old_url.split('/')[-1]
            
#             # Normalize it (same logic as rename_images.py)
#             new_filename = normalize_filename(old_filename)
            
#             # Verify the file actually exists
#             if new_filename not in actual_files:
#                 print(f"\033[31m[ERROR] File not found: {new_filename}\033[0m")
#                 missing_count += 1
#                 continue
            
#             # Build new URL
#             new_url = f"/assets/images/Eidos_7/Parking_Tower/{new_filename}"
            
#             if old_url != new_url:
#                 image["url"] = new_url
#                 updated_count += 1
#                 print(f"\033[32m[OK]\033[0m {old_url}")
#                 print(f"     -> {new_url}")

#     # Write back to file
#     with open(JSON_FILE, "w", encoding="utf-8") as f:
#         json.dump(data, f, indent=2, ensure_ascii=False)
    
#     print(f"\n\033[32m[OK] Updated {updated_count} URLs in {JSON_FILE}\033[0m")
#     if missing_count > 0:
#         print(f"\033[31m[ERROR] {missing_count} files not found\033[0m")

# if __name__ == "__main__":
#     update_json_urls()

import os
import json
from collections import defaultdict

# === CONFIG ===
JSON_FILE = "seed-data/collectibles/xion/xion.json"
IMAGE_DIR = "../client/public/assets/images/Xion/Xion"
URL_BASE = "/assets/images/Xion/Xion/"

def group_images_by_order(files):
    groups = defaultdict(list)

    for filename in files:
        if not filename.lower().endswith(".jpg"):
            continue

        if "_" not in filename:
            continue

        order = filename.split("_")[0]

        if not order.isdigit():
            continue

        groups[int(order)].append(filename)

    # Sort files for each order so they assign in correct sequence
    for order in groups:
        groups[order] = sorted(groups[order])

    return groups

def update_json_from_disk():
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    try:
        files = os.listdir(IMAGE_DIR)
    except FileNotFoundError:
        print(f"\033[31m[ERROR] Image folder not found: {IMAGE_DIR}\033[0m")
        return

    image_groups = group_images_by_order(files)

    updated = 0
    missing = 0
    extra = 0

    for item in data:
        order = item.get("display_order")

        if order not in image_groups:
            print(f"\033[31m[ERROR] No images found for order {order}\033[0m")
            missing += 1
            continue

        images_for_item = image_groups[order]

        if len(images_for_item) != len(item["images"]):
            print(
                f"\033[33m[WARN]\033[0m Order {order}: "
                f"{len(item['images'])} in JSON but {len(images_for_item)} on disk"
            )

        for i, image in enumerate(item["images"]):
            if i >= len(images_for_item):
                continue

            real_filename = images_for_item[i]
            new_url = f"{URL_BASE}{real_filename}"

            if image["url"] != new_url:
                print(f"\033[32m[OK] {image['url']}\033[0m")
                print(f"     -> {new_url}")
                image["url"] = new_url
                updated += 1

        # If more images on disk than in JSON
        if len(images_for_item) > len(item["images"]):
            extra += (len(images_for_item) - len(item["images"]))
            print(f"\033[34m[INFO]\033[0m Extra images found for order {order}: {images_for_item[len(item['images']):]}")

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n\033[32mUpdated: {updated}\033[0m")
    if missing:
        print(f"\033[31mMissing orders: {missing}\033[0m")
    if extra:
        print(f"\033[34mExtra images: {extra}\033[0m")


if __name__ == "__main__":
    update_json_from_disk()
