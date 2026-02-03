import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import glob
import re
from pathlib import Path


def add_transformations_to_url(cloudinary_url):
    """
    Add transformations to a Cloudinary URL.

    Inserts:
    /f_webp,q_auto/
    immediately after /upload/
    
    (No resizing needed since images are already 1080p)
    """

    transformations = "f_webp,q_auto"

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


def update_urls(dry_run=True, add_transformations=True, content_type='all'):
    """
    Update JSON files with Cloudinary URLs using the mapping file.
    Optionally add transformations for optimization.
    
    Args:
        dry_run: Show what would happen without making changes
        add_transformations: Add f_webp,q_auto
        content_type: 'collectibles', 'walkthroughs', or 'all'
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
        print("\033[36m=== Transformations: f_a,q_auto (format + quality optimization) ===\033[0m")
    print(f"\033[36m=== Content type: {content_type} ===\033[0m\n")

    # Determine which directories to scan
    seed_base = Path(__file__).resolve().parents[2] / 'seed-data'
    
    json_files = []
    
    if content_type in ['collectibles', 'all']:
        collectibles_dir = seed_base / 'collectibles'
        if collectibles_dir.exists():
            collectibles_files = sorted(glob.glob(str(collectibles_dir / '*' / '*.json')))
            json_files.extend(collectibles_files)
            print(f"\033[90mFound {len(collectibles_files)} collectibles JSON files\033[0m")
    
    if content_type in ['walkthroughs', 'all']:
        walkthroughs_dir = seed_base / 'walkthroughs'
        if walkthroughs_dir.exists():
            walkthroughs_files = sorted(glob.glob(str(walkthroughs_dir / '*' / '*.json')))
            json_files.extend(walkthroughs_files)
            print(f"\033[90mFound {len(walkthroughs_files)} walkthrough JSON files\033[0m")

    print(f"\033[36m=== Total: {len(json_files)} JSON files ===\033[0m\n")

    if len(json_files) == 0:
        print(f"\033[31m✗ No JSON files found in {seed_base}\033[0m")
        return

    updated_files = 0
    updated_urls = 0
    not_found = []

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        file_changed = False
        file_url_count = 0

        # Handle collectibles JSON (list of items)
        if isinstance(data, list):
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
        
        # Handle walkthrough JSON (single object with content array)
        elif isinstance(data, dict):
            # Update thumbnail_url if exists
            if 'thumbnail_url' in data and data['thumbnail_url']:
                old_url = data['thumbnail_url']
                if old_url in url_mapping:
                    new_url = url_mapping[old_url]
                    if add_transformations:
                        new_url = add_transformations_to_url(new_url)
                    
                    if old_url != new_url:
                        if not dry_run:
                            data['thumbnail_url'] = new_url
                        updated_urls += 1
                        file_url_count += 1
                        file_changed = True
                elif old_url not in not_found:
                    not_found.append(old_url)
            
            # Update content images
            for content_block in data.get('content', []):
                for img in content_block.get('images', []):
                    old_url = img['url']

                    if old_url in url_mapping:
                        new_url = url_mapping[old_url]

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
            rel_path = Path(json_file).relative_to(seed_base)

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


def reverse_urls(dry_run=True, content_type='all'):
    """
    Reverse Cloudinary URLs back to local paths using the mapping file.
    Version-agnostic matching to handle timestamp mismatches.
    
    Args:
        dry_run: Show what would happen without making changes
        content_type: 'collectibles', 'walkthroughs', or 'all'
    """
    
    import re
    
    # Load URL mapping
    mapping_file = Path(__file__).parent / 'url-mapping.json'
    
    if not mapping_file.exists():
        print("\033[31m✗ url-mapping.json not found!\033[0m")
        return
    
    with open(mapping_file, 'r', encoding='utf-8') as f:
        url_mapping = json.load(f)
    
    # Create version-agnostic lookup
    # Key: URL without version number, Value: local path
    version_agnostic_mapping = {}
    
    for local_path, cloudinary_url in url_mapping.items():
        # Strip version number: v1765221189 -> ""
        # Matches /v followed by digits followed by /
        url_without_version = re.sub(r'/v\d+/', '/', cloudinary_url)
        version_agnostic_mapping[url_without_version] = local_path
        
        # Also add transformed version (with f_auto,q_auto)
        if '/f_auto,q_auto/' not in url_without_version:
            transformed_auto = url_without_version.replace('/upload/', '/upload/f_auto,q_auto/')
            version_agnostic_mapping[transformed_auto] = local_path
            
            transformed_webp = url_without_version.replace('/upload/', '/upload/f_webp,q_auto/')
            version_agnostic_mapping[transformed_webp] = local_path
    
    print(f"\n\033[36m=== Loaded {len(version_agnostic_mapping)} version-agnostic mappings ===\033[0m")
    print(f"\033[36m=== Content type: {content_type} ===\033[0m\n")
    
    seed_base = Path(__file__).resolve().parents[2] / 'seed-data'
    
    json_files = []
    
    if content_type in ['collectibles', 'all']:
        collectibles_dir = seed_base / 'collectibles'
        if collectibles_dir.exists():
            collectibles_files = sorted(glob.glob(str(collectibles_dir / '*' / '*.json')))
            json_files.extend(collectibles_files)
            print(f"\033[90mFound {len(collectibles_files)} collectibles JSON files\033[0m")
    
    if content_type in ['walkthroughs', 'all']:
        walkthroughs_dir = seed_base / 'walkthroughs'
        if walkthroughs_dir.exists():
            walkthroughs_files = sorted(glob.glob(str(walkthroughs_dir / '*' / '*.json')))
            json_files.extend(walkthroughs_files)
            print(f"\033[90mFound {len(walkthroughs_files)} walkthrough JSON files\033[0m")

    print(f"\033[36m=== Total: {len(json_files)} JSON files ===\033[0m\n")
    
    updated_files = 0
    updated_urls = 0
    not_found = []
    
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_changed = False
        file_url_count = 0
        
        # Handle collectibles JSON (list)
        if isinstance(data, list):
            for item in data:
                for img in item.get('images', []):
                    old_url = img['url']
                    
                    # Strip version for lookup
                    url_without_version = re.sub(r'/v\d+/', '/', old_url)
                    
                    if url_without_version in version_agnostic_mapping:
                        new_url = version_agnostic_mapping[url_without_version]
                        
                        if old_url != new_url:
                            if not dry_run:
                                img['url'] = new_url
                            
                            updated_urls += 1
                            file_url_count += 1
                            file_changed = True
                    else:
                        if old_url not in not_found and 'cloudinary.com' in old_url:
                            not_found.append(old_url)
        
        # Handle walkthrough JSON (dict)
        elif isinstance(data, dict):
            if 'thumbnail_url' in data and data['thumbnail_url']:
                old_url = data['thumbnail_url']
                url_without_version = re.sub(r'/v\d+/', '/', old_url)
                
                if url_without_version in version_agnostic_mapping:
                    new_url = version_agnostic_mapping[url_without_version]
                    if old_url != new_url:
                        if not dry_run:
                            data['thumbnail_url'] = new_url
                        updated_urls += 1
                        file_url_count += 1
                        file_changed = True
                elif old_url not in not_found and 'cloudinary.com' in old_url:
                    not_found.append(old_url)
            
            for content_block in data.get('content', []):
                for img in content_block.get('images', []):
                    old_url = img['url']
                    
                    # Strip version for lookup
                    url_without_version = re.sub(r'/v\d+/', '/', old_url)
                    
                    if url_without_version in version_agnostic_mapping:
                        new_url = version_agnostic_mapping[url_without_version]
                        
                        if old_url != new_url:
                            if not dry_run:
                                img['url'] = new_url
                            
                            updated_urls += 1
                            file_url_count += 1
                            file_changed = True
                    else:
                        if old_url not in not_found and 'cloudinary.com' in old_url:
                            not_found.append(old_url)
        
        if file_changed:
            rel_path = Path(json_file).relative_to(seed_base)
            
            if dry_run:
                print(f"\033[33m[DRY RUN] Would revert: {rel_path} ({file_url_count} URLs)\033[0m")
            else:
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"\033[32m[REVERTED] {rel_path} ({file_url_count} URLs)\033[0m")
            
            updated_files += 1
    
    print(f"\n\033[36m=== Summary ===\033[0m")
    
    if dry_run:
        print(f"\033[33m[DRY RUN] Would revert {updated_files} files\033[0m")
        print(f"\033[33m[DRY RUN] Would revert {updated_urls} URLs\033[0m")
    else:
        print(f"\033[32m✓ Reverted {updated_files} files\033[0m")
        print(f"\033[32m✓ Reverted {updated_urls} URLs\033[0m")
    
    if not_found:
        print(f"\n\033[31m⚠  {len(not_found)} Cloudinary URLs not found in mapping:\033[0m")
        for url in not_found[:5]:
            print(f"   {url}")
        if len(not_found) > 5:
            print(f"   ... and {len(not_found) - 5} more")


if __name__ == "__main__":
    print("\033[36m=== Update URLs Script ===\033[0m")
    
    # Check command-line argument for content type
    content_type = 'all'
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ['collectibles', 'walkthroughs', 'all']:
            content_type = arg
        else:
            print(f"\033[31m✗ Invalid argument: {sys.argv[1]}\033[0m")
            print("Usage: python update_urls.py [collectibles|walkthroughs|all]")
            sys.exit(1)
    
    print("\n\033[36m=== Select Operation ===\033[0m")
    print("1. Apply Cloudinary URLs (normal)")
    print("2. Revert to local paths (reverse)")
    print("3. Exit")
    
    operation = input("\nChoose operation (1/2/3): ").strip()
    
    if operation == "2":
        # REVERSE OPERATION
        print(f"\n\033[33m⚠  Running REVERSE DRY RUN for: {content_type}\033[0m\n")
        reverse_urls(dry_run=True, content_type=content_type)
        
        confirm = input("\nApply reverse changes? (y/n): ").strip().lower()
        if confirm == 'y':
            print(f"\n\033[36m=== Reverting to Local Paths ===\033[0m\n")
            reverse_urls(dry_run=False, content_type=content_type)
            print("\n\033[32m✓ Reverted to local paths!\033[0m")
            print("\n\033[36mNext steps:\033[0m")
            if content_type in ['collectibles', 'all']:
                print("   1. Review: git diff seed-data/collectibles/")
                print("   2. Run: python scripts/db/seed_collectibles.py")
            if content_type in ['walkthroughs', 'all']:
                print("   3. Review: git diff seed-data/walkthroughs/")
                print("   4. Run: python scripts/db/seed_walkthroughs.py")
        else:
            print("\n\033[90mExited without changes\033[0m")
        sys.exit(0)
    
    elif operation != "1":
        print("\n\033[90mExited\033[0m")
        sys.exit(0)
    
    # NORMAL OPERATION (Apply Cloudinary URLs)
    print(f"\n\033[33m⚠  Running DRY RUN for: {content_type}\033[0m\n")

    # DRY RUN first
    update_urls(dry_run=True, add_transformations=True, content_type=content_type)

    print("\n\033[36m=== Options ===\033[0m")
    print("1. Apply changes WITH transformations (f_webp,q_auto)")
    print("2. Apply changes WITHOUT transformations")
    print("3. Exit without changes")

    choice = input("\nChoose option (1/2/3): ").strip()

    if choice == "1":
        print(f"\n\033[36m=== Applying Changes (WITH transformations) for {content_type} ===\033[0m\n")
        update_urls(dry_run=False, add_transformations=True, content_type=content_type)
        print("\n\033[32m✓ Complete!\033[0m")
        print("\n\033[36mNext steps:\033[0m")
        if content_type in ['collectibles', 'all']:
            print("   1. Review: git diff seed-data/collectibles/")
            print("   2. Run: python scripts/db/seed_collectibles.py")
        if content_type in ['walkthroughs', 'all']:
            print("   3. Review: git diff seed-data/walkthroughs/")
            print("   4. Run: python scripts/db/seed_walkthroughs.py")
        print("   5. Test your website")

    elif choice == "2":
        print(f"\n\033[36m=== Applying Changes (WITHOUT transformations) for {content_type} ===\033[0m\n")
        update_urls(dry_run=False, add_transformations=False, content_type=content_type)
        print("\n\033[32m✓ Complete!\033[0m")
        print("\n\033[36mNext steps:\033[0m")
        if content_type in ['collectibles', 'all']:
            print("   1. Review: git diff seed-data/collectibles/")
            print("   2. Run: python scripts/db/seed_collectibles.py")
        if content_type in ['walkthroughs', 'all']:
            print("   3. Review: git diff seed-data/walkthroughs/")
            print("   4. Run: python scripts/db/seed_walkthroughs.py")
        print("   5. Test your website")

    else:
        print("\n\033[90mExited without changes\033[0m")