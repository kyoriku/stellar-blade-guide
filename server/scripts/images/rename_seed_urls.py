import os
import json
import re
from collections import defaultdict

# === CONFIG ===
JSON_FILE = "seed-data/collectibles/wasteland/scrap-plains-continued.json"
IMAGE_DIR = "../client/public/assets/images/Wasteland/Scrap_Plains_Continued"
URL_BASE = "/assets/images/Wasteland/Scrap_Plains_Continued/"

def group_images_by_prefix(files):
    """Group images by their numeric prefix"""
    groups = defaultdict(list)
    
    for filename in files:
        if not filename.lower().endswith(".jpg"):
            continue
        
        if "_" not in filename:
            continue
        
        prefix = filename.split("_")[0]
        if not prefix.isdigit():
            continue
        
        groups[int(prefix)].append(filename)
    
    # Sort files for each prefix
    for prefix in groups:
        groups[prefix] = sorted(groups[prefix])
    
    return groups

def sequential_fallback_mapping(json_orders, disk_prefixes):
    """
    Create a mapping that tries to match orders to prefixes.
    If there are gaps, map sequentially.
    """
    mapping = {}
    
    # Get sorted lists
    sorted_orders = sorted(json_orders)
    sorted_prefixes = sorted(disk_prefixes)
    
    # Try to map 1:1 first
    for i, order in enumerate(sorted_orders):
        if i < len(sorted_prefixes):
            mapping[order] = sorted_prefixes[i]
        else:
            print(f"\033[31m[ERROR] Order {order}: No more disk images available\033[0m")
    
    return mapping

def process_updates(data, order_to_prefix, disk_groups, dry_run=False):
    """Process the URL updates"""
    updated = 0
    skipped = 0

    for item in data:
        order = item.get("display_order")
        
        if order not in order_to_prefix:
            print(f"\033[33m[SKIP] Order {order}: {item['title']} - no mapping\033[0m")
            skipped += 1
            continue
        
        prefix = order_to_prefix[order]
        
        if prefix not in disk_groups:
            print(f"\033[31m[ERROR] Order {order}: Prefix {prefix} not found on disk\033[0m")
            skipped += 1
            continue
        
        images_for_item = disk_groups[prefix]

        # Warn if count mismatch
        if len(images_for_item) != len(item["images"]):
            print(f"\033[33m[WARN] Order {order}: JSON has {len(item['images'])} images, disk has {len(images_for_item)}\033[0m")

        # Update URLs
        for i, image in enumerate(item["images"]):
            if i >= len(images_for_item):
                print(f"\033[31m[ERROR] Order {order}: Image index {i+1} missing on disk\033[0m")
                break

            real_filename = images_for_item[i]
            new_url = f"{URL_BASE}{real_filename}"

            if image["url"] != new_url:
                old_name = os.path.basename(image['url'])
                print(f"\033[32m[OK] {old_name}\033[0m")
                print(f"     -> {real_filename}")
                
                if not dry_run:
                    image["url"] = new_url
                updated += 1
    
    return updated, skipped

def update_json_from_disk():
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    try:
        files = os.listdir(IMAGE_DIR)
    except FileNotFoundError:
        print(f"\033[31m[ERROR] Image folder not found: {IMAGE_DIR}\033[0m")
        return

    disk_groups = group_images_by_prefix(files)
    
    # Get all orders from JSON
    json_orders = [item['display_order'] for item in data]
    disk_prefixes = list(disk_groups.keys())
    
    print("\n\033[36m=== Mapping Strategy ===\033[0m")
    print(f"JSON has {len(json_orders)} collectibles (orders: {sorted(json_orders)})")
    print(f"Disk has {len(disk_prefixes)} image groups (prefixes: {sorted(disk_prefixes)})")
    
    # Create sequential mapping
    order_to_prefix = sequential_fallback_mapping(json_orders, disk_prefixes)
    
    print("\n\033[36m=== Mappings ===\033[0m")
    for order in sorted(order_to_prefix.keys()):
        prefix = order_to_prefix[order]
        item = next(x for x in data if x['display_order'] == order)
        
        if order == prefix:
            print(f"  Order {order:2d} → Prefix {prefix:2d} \033[32m(exact)\033[0m {item['title']}")
        else:
            print(f"  Order {order:2d} → Prefix {prefix:2d} \033[33m(mapped)\033[0m {item['title']}")
    
    # Main menu loop
    while True:
        print("\n\033[36m=== Options ===\033[0m")
        print("1. Update URLs with these mappings")
        print("2. Dry run (show what would change)")
        print("3. Exit")
        
        choice = input("\nChoose option (1/2/3): ").strip()
        
        if choice == "3":
            print("Exited without changes.")
            return
        
        if choice == "2":
            print("\n\033[36m=== DRY RUN - No changes will be made ===\033[0m\n")
            updated, skipped = process_updates(data, order_to_prefix, disk_groups, dry_run=True)
            print(f"\n\033[36m[DRY RUN] Would update {updated} URLs\033[0m")
            if skipped:
                print(f"\033[33m⚠ Skipped {skipped} orders\033[0m")
            # Loop continues so user can choose option 1 next
            
        elif choice == "1":
            print("\n\033[36m=== Updating URLs ===\033[0m\n")
            updated, skipped = process_updates(data, order_to_prefix, disk_groups, dry_run=False)
            
            if updated > 0:
                with open(JSON_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"\n\033[32m✓ Updated {updated} image URLs in {JSON_FILE}\033[0m")
            else:
                print(f"\n\033[36mNo changes needed\033[0m")
            
            if skipped:
                print(f"\033[33m⚠ Skipped {skipped} orders\033[0m")
            
            # Exit after successful update
            return
        
        else:
            print("\033[31mInvalid choice. Please enter 1, 2, or 3.\033[0m")

if __name__ == "__main__":
    update_json_from_disk()