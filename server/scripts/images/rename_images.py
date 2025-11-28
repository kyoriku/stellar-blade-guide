import os
import re
import json

# === CONFIG ===
IMAGE_DIR = "../client/public/assets/images/Spire_4/High_Orbit_Station"
JSON_FILE = "seed-data/collectibles/spire-4/high-orbit-station.json"

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
