# import sys
# import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# import json
# import glob
# from pathlib import Path
# import re

# def add_transformations_to_url(cloudinary_url, transformations="f_auto,q_auto"):
#     """
#     Add transformations to a Cloudinary URL.
    
#     Example:
#     Input:  https://res.cloudinary.com/drw9mrozr/image/upload/v1764281519/stellar-blade/...
#     Output: https://res.cloudinary.com/drw9mrozr/image/upload/f_auto,q_auto/v1764281519/stellar-blade/...
#     """
#     # Pattern: insert transformations after /upload/
#     pattern = r'(/upload/)([^/]+/)(.+)'
    
#     def replace_fn(match):
#         upload_part = match.group(1)      # /upload/
#         version_part = match.group(2)     # v1764281519/
#         path_part = match.group(3)        # stellar-blade/...
        
#         # Insert transformations between upload and version
#         return f"{upload_part}{transformations}/{version_part}{path_part}"
    
#     transformed_url = re.sub(pattern, replace_fn, cloudinary_url)
#     return transformed_url

# def update_urls(dry_run=True, add_transformations=True):
#     """
#     Update all JSON seed files with Cloudinary URLs using the mapping file.
#     Optionally add transformations for optimization.
#     """
    
#     # Load URL mapping
#     mapping_file = Path(__file__).parent / 'url-mapping.json'
    
#     if not mapping_file.exists():
#         print("\033[31m✗ url-mapping.json not found!\033[0m")
#         print("   Run upload_cloudinary.py first")
#         return
    
#     with open(mapping_file, 'r', encoding='utf-8') as f:
#         url_mapping = json.load(f)
    
#     print(f"\n\033[36m=== Loaded {len(url_mapping)} URL mappings ===\033[0m")
#     if add_transformations:
#         print(f"\033[36m=== Transformations: f_auto,q_auto ===\033[0m\n")
#     else:
#         print()
    
#     # Get all seed JSON files
#     seed_dir = Path(__file__).parent.parent / 'seed-data' / 'collectibles'
#     json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
#     print(f"\033[36m=== Found {len(json_files)} JSON files ===\033[0m\n")
    
#     if len(json_files) == 0:
#         print(f"\033[31m✗ No JSON files found in {seed_dir}\033[0m")
#         return
    
#     updated_files = 0
#     updated_urls = 0
#     not_found = []
    
#     for json_file in json_files:
#         with open(json_file, 'r', encoding='utf-8') as f:
#             data = json.load(f)
        
#         file_changed = False
#         file_url_count = 0
        
#         for item in data:
#             for img in item.get('images', []):
#                 old_url = img['url']
                
#                 # Check if we have a Cloudinary URL for this
#                 if old_url in url_mapping:
#                     new_url = url_mapping[old_url]
                    
#                     # Add transformations if requested
#                     if add_transformations:
#                         new_url = add_transformations_to_url(new_url)
                    
#                     if old_url != new_url:
#                         if not dry_run:
#                             img['url'] = new_url
                        
#                         updated_urls += 1
#                         file_url_count += 1
#                         file_changed = True
#                 else:
#                     # Track URLs not found in mapping
#                     if old_url not in not_found:
#                         not_found.append(old_url)
        
#         # Write back if changed (and not dry run)
#         if file_changed:
#             rel_path = Path(json_file).relative_to(seed_dir)
            
#             if dry_run:
#                 print(f"\033[33m[DRY RUN] Would update: {rel_path} ({file_url_count} URLs)\033[0m")
#             else:
#                 with open(json_file, 'w', encoding='utf-8') as f:
#                     json.dump(data, f, indent=2, ensure_ascii=False)
                
#                 print(f"\033[32m[UPDATED] {rel_path} ({file_url_count} URLs)\033[0m")
            
#             updated_files += 1
    
#     print(f"\n\033[36m=== Summary ===\033[0m")
    
#     if dry_run:
#         print(f"\033[33m[DRY RUN] Would update {updated_files} files\033[0m")
#         print(f"\033[33m[DRY RUN] Would update {updated_urls} URLs\033[0m")
#     else:
#         print(f"\033[32m✓ Updated {updated_files} files\033[0m")
#         print(f"\033[32m✓ Updated {updated_urls} URLs\033[0m")
    
#     if not_found:
#         print(f"\n\033[31m⚠  {len(not_found)} URLs not found in mapping:\033[0m")
#         for url in not_found[:10]:  # Show first 10
#             print(f"   {url}")
#         if len(not_found) > 10:
#             print(f"   ... and {len(not_found) - 10} more")
    
#     # Show example transformation
#     if add_transformations and updated_urls > 0 and dry_run:
#         print(f"\n\033[36m=== Example Transformation ===\033[0m")
#         # Find first URL in mapping
#         first_old_url = list(url_mapping.keys())[0]
#         first_new_url = url_mapping[first_old_url]
#         transformed = add_transformations_to_url(first_new_url)
#         print(f"\033[90mOriginal:\033[0m")
#         print(f"  {first_new_url}")
#         print(f"\033[32mTransformed:\033[0m")
#         print(f"  {transformed}")

# if __name__ == "__main__":
#     print("\033[36m=== Update URLs Script ===\033[0m")
#     print("\033[33m⚠  Running in DRY RUN mode first\033[0m\n")
    
#     # DRY RUN first
#     update_urls(dry_run=True, add_transformations=True)
    
#     print("\n\033[36m=== Options ===\033[0m")
#     print("1. Apply changes WITH transformations (f_auto,q_auto)")
#     print("2. Apply changes WITHOUT transformations (original URLs)")
#     print("3. Exit without changes")
    
#     choice = input("\nChoose option (1/2/3): ").strip()
    
#     if choice == "1":
#         print("\n\033[36m=== Applying Changes (WITH transformations) ===\033[0m\n")
#         update_urls(dry_run=False, add_transformations=True)
#         print("\n\033[32m✓ Complete!\033[0m")
#         print("\n\033[36mNext steps:\033[0m")
#         print("   1. Review changes: git diff seed-data/")
#         print("   2. Run: python scripts/db/seed_collectibles.py")
#         print("   3. Test your website")
#     elif choice == "2":
#         print("\n\033[36m=== Applying Changes (WITHOUT transformations) ===\033[0m\n")
#         update_urls(dry_run=False, add_transformations=False)
#         print("\n\033[32m✓ Complete!\033[0m")
#         print("\n\033[36mNext steps:\033[0m")
#         print("   1. Review changes: git diff seed-data/")
#         print("   2. Run: python scripts/db/seed_collectibles.py")
#         print("   3. Test your website")
#     else:
#         print("\n\033[90mExited without changes\033[0m")


import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import glob
from pathlib import Path


def add_transformations_to_url(cloudinary_url):
    """
    Add transformations to a Cloudinary URL.

    Inserts:
    /w_1920,h_1080,c_fill/f_auto,q_auto/
    immediately after /upload/
    """

    transformations = "w_1920,h_1080,c_fill/f_auto,q_auto"

    # If transformations already exist, do nothing (prevents double runs)
    if f"/upload/{transformations}/" in cloudinary_url:
        return cloudinary_url

    # Insert transformations after /upload/
    if "/upload/" in cloudinary_url:
        return cloudinary_url.replace(
            "/upload/",
            f"/upload/{transformations}/",
            1
        )

    # Fallback - return original URL
    return cloudinary_url


def update_urls(dry_run=True, add_transformations=True):
    """
    Update all JSON seed files with Cloudinary URLs using the mapping file.
    Optionally add transformations for optimization.
    """

    # Load URL mapping
    mapping_file = Path(__file__).parent / 'url-mapping.json'

    if not mapping_file.exists():
        print("\033[31m✗ url-mapping.json not found!\033[0m")
        print("   Run upload_cloudinary.py first")
        return

    with open(mapping_file, 'r', encoding='utf-8') as f:
        url_mapping = json.load(f)

    print(f"\n\033[36m=== Loaded {len(url_mapping)} URL mappings ===\033[0m")
    if add_transformations:
        print("\033[36m=== Transformations: w_1920,h_1080,c_fill/f_auto,q_auto ===\033[0m\n")
    else:
        print()

    # ✅ FIXED PATH
    seed_dir = Path(__file__).resolve().parents[2] / 'seed-data' / 'collectibles'

    print(f"\033[90mLooking for JSON in: {seed_dir}\033[0m")

    if not seed_dir.exists():
        print(f"\033[31m✗ Folder not found: {seed_dir}\033[0m")
        return

    # Get all seed JSON files
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))

    print(f"\033[36m=== Found {len(json_files)} JSON files ===\033[0m\n")

    if len(json_files) == 0:
        print(f"\033[31m✗ No JSON files found in {seed_dir}\033[0m")
        return

    updated_files = 0
    updated_urls = 0
    not_found = []

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        file_changed = False
        file_url_count = 0

        for item in data:
            for img in item.get('images', []):
                old_url = img['url']

                # Check if we have a Cloudinary URL for this
                if old_url in url_mapping:
                    new_url = url_mapping[old_url]

                    # Add transformations if requested
                    if add_transformations:
                        new_url = add_transformations_to_url(new_url)

                    if old_url != new_url:
                        if not dry_run:
                            img['url'] = new_url

                        updated_urls += 1
                        file_url_count += 1
                        file_changed = True
                else:
                    if old_url not in not_found:
                        not_found.append(old_url)

        # Write back if changed (and not dry run)
        if file_changed:
            rel_path = Path(json_file).relative_to(seed_dir)

            if dry_run:
                print(f"\033[33m[DRY RUN] Would update: {rel_path} ({file_url_count} URLs)\033[0m")
            else:
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

                print(f"\033[32m[UPDATED] {rel_path} ({file_url_count} URLs)\033[0m")

            updated_files += 1

    print(f"\n\033[36m=== Summary ===\033[0m")

    if dry_run:
        print(f"\033[33m[DRY RUN] Would update {updated_files} files\033[0m")
        print(f"\033[33m[DRY RUN] Would update {updated_urls} URLs\033[0m")
    else:
        print(f"\033[32m✓ Updated {updated_files} files\033[0m")
        print(f"\033[32m✓ Updated {updated_urls} URLs\033[0m")

    if not_found:
        print(f"\n\033[31m⚠  {len(not_found)} URLs not found in mapping:\033[0m")
        for url in not_found[:10]:
            print(f"   {url}")
        if len(not_found) > 10:
            print(f"   ... and {len(not_found) - 10} more")

    # Show example transformation
    if add_transformations and updated_urls > 0 and dry_run:
        print(f"\n\033[36m=== Example Transformation ===\033[0m")

        first_old_url = list(url_mapping.keys())[0]
        first_new_url = url_mapping[first_old_url]
        transformed = add_transformations_to_url(first_new_url)

        print(f"\033[90mOriginal:\033[0m")
        print(f"  {first_new_url}")
        print(f"\033[32mTransformed:\033[0m")
        print(f"  {transformed}")


if __name__ == "__main__":
    print("\033[36m=== Update URLs Script ===\033[0m")
    print("\033[33m⚠  Running in DRY RUN mode first\033[0m\n")

    # DRY RUN first
    update_urls(dry_run=True, add_transformations=True)

    print("\n\033[36m=== Options ===\033[0m")
    print("1. Apply changes WITH transformations")
    print("2. Apply changes WITHOUT transformations")
    print("3. Exit without changes")

    choice = input("\nChoose option (1/2/3): ").strip()

    if choice == "1":
        print("\n\033[36m=== Applying Changes (WITH transformations) ===\033[0m\n")
        update_urls(dry_run=False, add_transformations=True)
        print("\n\033[32m✓ Complete!\033[0m")
        print("\n\033[36mNext steps:\033[0m")
        print("   1. Review changes: git diff seed-data/")
        print("   2. Run: python scripts/db/seed_collectibles.py")
        print("   3. Test your website")

    elif choice == "2":
        print("\n\033[36m=== Applying Changes (WITHOUT transformations) ===\033[0m\n")
        update_urls(dry_run=False, add_transformations=False)
        print("\n\033[32m✓ Complete!\033[0m")
        print("\n\033[36mNext steps:\033[0m")
        print("   1. Review changes: git diff seed-data/")
        print("   2. Run: python scripts/db/seed_collectibles.py")
        print("   3. Test your website")

    else:
        print("\n\033[90mExited without changes\033[0m")
