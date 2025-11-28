# import sys
# import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# import cloudinary
# import cloudinary.uploader
# from pathlib import Path
# import json
# from dotenv import load_dotenv

# load_dotenv()

# # Configure Cloudinary
# cloudinary.config(
#     cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
#     api_key=os.getenv('CLOUDINARY_API_KEY'),
#     api_secret=os.getenv('CLOUDINARY_API_SECRET')
# )

# def upload_images(dry_run=True):
#     """
#     Upload all images from client/public/assets/images to Cloudinary.
#     Preserves folder structure with URL-friendly naming.
#     """
    
#     # Path to images directory
#     images_dir = Path(__file__).parent.parent.parent.parent / 'client' / 'public' / 'assets' / 'images'
    
#     if not images_dir.exists():
#         print(f"\033[31m✗ Images directory not found: {images_dir}\033[0m")
#         return
    
#     print(f"\n\033[36m=== Scanning Images ===\033[0m")
#     print(f"Directory: {images_dir}\n")
    
#     # Find all image files
#     image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
#     image_files = []
    
#     for ext in image_extensions:
#         image_files.extend(images_dir.rglob(f'*{ext}'))
    
#     print(f"Found \033[33m{len(image_files)}\033[0m images to upload\n")
    
#     if len(image_files) == 0:
#         print("\033[31m✗ No images found!\033[0m")
#         return
    
#     # Load existing mapping if it exists
#     mapping_file = Path(__file__).parent / 'url-mapping.json'
#     url_mapping = {}
    
#     if mapping_file.exists():
#         print("\033[36m=== Loading Existing Mapping ===\033[0m")
#         with open(mapping_file, 'r', encoding='utf-8') as f:
#             url_mapping = json.load(f)
#         print(f"Found \033[33m{len(url_mapping)}\033[0m existing mappings\n")
    
#     uploaded = 0
#     skipped = 0
#     errors = 0
    
#     if dry_run:
#         print("\033[33m=== DRY RUN MODE - No uploads will be performed ===\033[0m\n")
#     else:
#         print("\033[36m=== Uploading Images ===\033[0m\n")
    
#     # Show first 10 and last 10 in dry run, all in real mode
#     show_limit = 10 if dry_run else None
#     shown_count = 0
    
#     for img_path in sorted(image_files):
#         try:
#             # Get relative path from images directory
#             rel_path = img_path.relative_to(images_dir)
            
#             # Create URL-friendly public_id with hyphens and lowercase
#             # Great_Desert/Northern_Great_Desert/1_Image.jpg 
#             #   -> stellar-blade/collectibles/great-desert/northern-great-desert/1-image
#             folder_path = rel_path.parent.as_posix().replace('_', '-').lower()
#             filename = rel_path.stem.replace('_', '-').replace('&', 'and').lower()
#             public_id = f"stellar-blade/collectibles/{folder_path}/{filename}"
            
#             # Asset folder for dashboard organization
#             asset_folder = f"stellar-blade/collectibles/{folder_path}"
            
#             # Old URL format (what's currently in database)
#             old_url = f"/assets/images/{rel_path.as_posix()}"
            
#             # Check if already in mapping (from previous run)
#             if old_url in url_mapping:
#                 if dry_run and shown_count < show_limit:
#                     print(f"\033[90m[SKIP] {rel_path}\033[0m")
#                     shown_count += 1
#                 elif not dry_run:
#                     print(f"\033[90m[SKIP] {rel_path}\033[0m")
#                 skipped += 1
#                 continue
            
#             if dry_run:
#                 if shown_count < show_limit:
#                     print(f"\033[33m[DRY RUN] Would upload: {rel_path}\033[0m")
#                     print(f"\033[90m    → public_id: {public_id}\033[0m")
#                     print(f"\033[90m    → asset_folder: {asset_folder}\033[0m")
#                     cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
#                     expected_url = f"https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.jpg"
#                     print(f"\033[90m    → URL: {expected_url}\033[0m\n")
#                     shown_count += 1
#                 elif shown_count == show_limit:
#                     print(f"\033[90m... and {len(image_files) - skipped - show_limit} more images ...\033[0m\n")
#                     shown_count += 1
                
#                 uploaded += 1
#                 continue
            
#             print(f"\033[36m[UPLOAD] {rel_path}\033[0m")
#             print(f"\033[90m    → {public_id}\033[0m")
            
#             # Upload to Cloudinary with automatic optimization
#             result = cloudinary.uploader.upload(
#                 str(img_path),
#                 public_id=public_id,
#                 asset_folder=asset_folder,  # Dashboard organization
#                 resource_type="image",
#                 overwrite=False,
#                 unique_filename=False,
#                 use_filename=False,  # Use our custom public_id
#                 # Add optimization
#                 quality="auto",
#                 fetch_format="auto"
#             )
            
#             # Get Cloudinary URL
#             cloudinary_url = result['secure_url']
            
#             # Store mapping
#             url_mapping[old_url] = cloudinary_url
            
#             uploaded += 1
#             print(f"\033[32m    ✓ {cloudinary_url}\033[0m\n")
            
#         except cloudinary.exceptions.Error as e:
#             if 'already exists' in str(e).lower():
#                 # Image exists on Cloudinary but not in our mapping
#                 # Construct the expected URL
#                 cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
#                 cloudinary_url = f"https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.jpg"
#                 url_mapping[old_url] = cloudinary_url
#                 print(f"\033[90m    → Already exists on Cloudinary, added to mapping\033[0m\n")
#                 skipped += 1
#             else:
#                 print(f"\033[31m    ✗ Error: {e}\033[0m\n")
#                 errors += 1
#         except Exception as e:
#             print(f"\033[31m    ✗ Error: {e}\033[0m\n")
#             errors += 1
    
#     # Save mapping to JSON file (only in real mode)
#     if not dry_run:
#         with open(mapping_file, 'w', encoding='utf-8') as f:
#             json.dump(url_mapping, f, indent=2)
    
#     print("\n\033[36m=== Upload Summary ===\033[0m")
    
#     if dry_run:
#         print(f"\033[33m[DRY RUN] Would upload: {uploaded}\033[0m")
#         print(f"\033[90m[DRY RUN] Would skip: {skipped}\033[0m")
#         print(f"\033[36m[DRY RUN] Total to process: {uploaded + skipped}\033[0m")
#     else:
#         print(f"\033[32m✓ Uploaded: {uploaded}\033[0m")
#         print(f"\033[90m→ Skipped: {skipped}\033[0m")
#         if errors > 0:
#             print(f"\033[31m✗ Errors: {errors}\033[0m")
#         else:
#             print(f"\033[32m✓ Errors: {errors}\033[0m")
#         print(f"\033[36m→ Total mappings: {len(url_mapping)}\033[0m")
#         print(f"\033[36m→ Mapping file: {mapping_file}\033[0m")

# if __name__ == "__main__":
#     print("\033[36m=== Cloudinary Upload Script ===\033[0m")
    
#     # Confirm credentials are set
#     if not all([
#         os.getenv('CLOUDINARY_CLOUD_NAME'),
#         os.getenv('CLOUDINARY_API_KEY'),
#         os.getenv('CLOUDINARY_API_SECRET')
#     ]):
#         print("\033[31m✗ Cloudinary credentials not found in .env file!\033[0m")
#         print("   Make sure you have:")
#         print("   - CLOUDINARY_CLOUD_NAME")
#         print("   - CLOUDINARY_API_KEY")
#         print("   - CLOUDINARY_API_SECRET")
#         sys.exit(1)
    
#     # Run dry run first
#     print("\033[33m⚠  Running DRY RUN first (showing first 10 images)\033[0m")
#     upload_images(dry_run=True)
    
#     # Ask user to confirm
#     print("\n\033[36m=== Confirmation ===\033[0m")
#     print("This will:")
#     print("  1. Upload ALL images to Cloudinary")
#     print("  2. Apply URL-friendly naming (lowercase, hyphens)")
#     print("  3. Enable auto-optimization (quality='auto', format='auto')")
#     print("  4. Organize in dashboard: stellar-blade/collectibles/{level}/{location}/")
#     print("  5. Create url-mapping.json for update_urls.py")
#     print("  6. Skip images already uploaded (idempotent)")
#     print("\n\033[33mType 'yes' to proceed with upload:\033[0m ", end='')
    
#     confirm = input().strip().lower()
    
#     if confirm == 'yes':
#         print()
#         upload_images(dry_run=False)
#     else:
#         print("\n\033[90mCancelled - no images uploaded\033[0m")

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cloudinary
import cloudinary.uploader
from pathlib import Path
import json
import time
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_images(dry_run=True):
    """
    Upload all images from client/public/assets/images to Cloudinary.
    Preserves folder structure with URL-friendly naming.
    """
    
    start_time = time.time()
    
    # Path to images directory
    images_dir = Path(__file__).parent.parent.parent.parent / 'client' / 'public' / 'assets' / 'images'
    
    if not images_dir.exists():
        print(f"\033[31m✗ Images directory not found: {images_dir}\033[0m")
        return
    
    print(f"\n\033[36m=== Scanning Images ===\033[0m")
    print(f"Directory: {images_dir}\n")
    
    # Find all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    image_files = []
    
    for ext in image_extensions:
        image_files.extend(images_dir.rglob(f'*{ext}'))
    
    total_images = len(image_files)
    print(f"Found \033[33m{total_images}\033[0m images to upload\n")
    
    if total_images == 0:
        print("\033[31m✗ No images found!\033[0m")
        return
    
    # Load existing mapping if it exists
    mapping_file = Path(__file__).parent / 'url-mapping.json'
    url_mapping = {}
    
    if mapping_file.exists():
        print("\033[36m=== Loading Existing Mapping ===\033[0m")
        with open(mapping_file, 'r', encoding='utf-8') as f:
            url_mapping = json.load(f)
        print(f"Found \033[33m{len(url_mapping)}\033[0m existing mappings\n")
    
    uploaded = 0
    skipped = 0
    errors = 0
    total_bytes = 0
    
    if dry_run:
        print("\033[33m=== DRY RUN MODE - No uploads will be performed ===\033[0m\n")
    else:
        print("\033[36m=== Uploading Images ===\033[0m\n")
    
    # Show first 10 in dry run, all in real mode
    show_limit = 10 if dry_run else None
    shown_count = 0
    
    for idx, img_path in enumerate(sorted(image_files), 1):
        try:
            # Get relative path from images directory
            rel_path = img_path.relative_to(images_dir)
            
            # Create URL-friendly public_id with hyphens and lowercase
            # Great_Desert/Northern_Great_Desert/1_Image.jpg 
            #   -> stellar-blade/collectibles/great-desert/northern-great-desert/1-image
            folder_path = rel_path.parent.as_posix().replace('_', '-').lower()
            filename = rel_path.stem.replace('_', '-').replace('&', 'and').lower()
            public_id = f"stellar-blade/collectibles/{folder_path}/{filename}"
            
            # Asset folder for dashboard organization
            asset_folder = f"stellar-blade/collectibles/{folder_path}"
            
            # Old URL format (what's currently in database)
            old_url = f"/assets/images/{rel_path.as_posix()}"
            
            # Check if already in mapping (from previous run)
            if old_url in url_mapping:
                if dry_run and shown_count < show_limit:
                    print(f"\033[90m[SKIP] {rel_path}\033[0m")
                    shown_count += 1
                elif not dry_run:
                    print(f"\033[90m[{idx}/{total_images}] [SKIP] {rel_path}\033[0m")
                skipped += 1
                continue
            
            if dry_run:
                if shown_count < show_limit:
                    print(f"\033[33m[DRY RUN] Would upload: {rel_path}\033[0m")
                    print(f"\033[90m    → public_id: {public_id}\033[0m")
                    print(f"\033[90m    → asset_folder: {asset_folder}\033[0m")
                    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
                    expected_url = f"https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.jpg"
                    print(f"\033[90m    → URL: {expected_url}\033[0m\n")
                    shown_count += 1
                elif shown_count == show_limit:
                    print(f"\033[90m... and {total_images - skipped - show_limit} more images ...\033[0m\n")
                    shown_count += 1
                
                uploaded += 1
                continue
            
            # Get file size
            file_size = img_path.stat().st_size
            file_size_mb = file_size / (1024 * 1024)
            
            print(f"\033[36m[{idx}/{total_images}] [UPLOAD] {rel_path} ({file_size_mb:.2f} MB)\033[0m")
            print(f"\033[90m    → {public_id}\033[0m")
            
            # Upload to Cloudinary with automatic optimization
            result = cloudinary.uploader.upload(
                str(img_path),
                public_id=public_id,
                asset_folder=asset_folder,  # Dashboard organization
                resource_type="image",
                overwrite=False,
                unique_filename=False,
                use_filename=False,  # Use our custom public_id
                # Add optimization
                quality="auto",
                fetch_format="auto"
            )
            
            # Get Cloudinary URL and size
            cloudinary_url = result['secure_url']
            cloudinary_bytes = result.get('bytes', 0)
            total_bytes += cloudinary_bytes
            
            # Store mapping
            url_mapping[old_url] = cloudinary_url
            
            uploaded += 1
            
            # Calculate compression ratio
            compression_ratio = ((file_size - cloudinary_bytes) / file_size * 100) if file_size > 0 else 0
            cloudinary_mb = cloudinary_bytes / (1024 * 1024)
            
            print(f"\033[32m    ✓ {cloudinary_url}\033[0m")
            print(f"\033[90m    → Cloudinary: {cloudinary_mb:.2f} MB (saved {compression_ratio:.1f}%)\033[0m\n")
            
        except cloudinary.exceptions.Error as e:
            if 'already exists' in str(e).lower():
                # Image exists on Cloudinary but not in our mapping
                # Construct the expected URL
                cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
                cloudinary_url = f"https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.jpg"
                url_mapping[old_url] = cloudinary_url
                print(f"\033[90m[{idx}/{total_images}] {rel_path}\033[0m")
                print(f"\033[90m    → Already exists on Cloudinary, added to mapping\033[0m\n")
                skipped += 1
            else:
                print(f"\033[31m[{idx}/{total_images}] ✗ {rel_path}\033[0m")
                print(f"\033[31m    ✗ Error: {e}\033[0m\n")
                errors += 1
        except Exception as e:
            print(f"\033[31m[{idx}/{total_images}] ✗ {rel_path}\033[0m")
            print(f"\033[31m    ✗ Error: {e}\033[0m\n")
            errors += 1
    
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    minutes = int(elapsed_time // 60)
    seconds = int(elapsed_time % 60)
    
    # Save mapping to JSON file (only in real mode)
    if not dry_run:
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(url_mapping, f, indent=2)
    
    print("\n\033[36m=== Upload Summary ===\033[0m")
    
    if dry_run:
        print(f"\033[33m[DRY RUN] Would upload: {uploaded}\033[0m")
        print(f"\033[90m[DRY RUN] Would skip: {skipped}\033[0m")
        print(f"\033[36m[DRY RUN] Total to process: {uploaded + skipped}\033[0m")
    else:
        print(f"\033[32m✓ Uploaded: {uploaded}\033[0m")
        print(f"\033[90m→ Skipped: {skipped}\033[0m")
        if errors > 0:
            print(f"\033[31m✗ Errors: {errors}\033[0m")
        else:
            print(f"\033[32m✓ Errors: {errors}\033[0m")
        
        # Storage metrics
        total_mb = total_bytes / (1024 * 1024)
        total_gb = total_mb / 1024
        avg_mb = total_mb / uploaded if uploaded > 0 else 0
        
        print(f"\033[36m→ Total storage used: {total_mb:.2f} MB ({total_gb:.3f} GB)\033[0m")
        print(f"\033[36m→ Average per image: {avg_mb:.2f} MB\033[0m")
        print(f"\033[36m→ Total mappings: {len(url_mapping)}\033[0m")
        print(f"\033[36m→ Mapping file: {mapping_file}\033[0m")
        
        # Time metrics
        print(f"\033[36m→ Time elapsed: {minutes}m {seconds}s\033[0m")
        if uploaded > 0:
            avg_time = elapsed_time / uploaded
            print(f"\033[36m→ Average per image: {avg_time:.2f}s\033[0m")

if __name__ == "__main__":
    print("\033[36m=== Cloudinary Upload Script ===\033[0m")
    
    # Confirm credentials are set
    if not all([
        os.getenv('CLOUDINARY_CLOUD_NAME'),
        os.getenv('CLOUDINARY_API_KEY'),
        os.getenv('CLOUDINARY_API_SECRET')
    ]):
        print("\033[31m✗ Cloudinary credentials not found in .env file!\033[0m")
        print("   Make sure you have:")
        print("   - CLOUDINARY_CLOUD_NAME")
        print("   - CLOUDINARY_API_KEY")
        print("   - CLOUDINARY_API_SECRET")
        sys.exit(1)
    
    # Run dry run first
    print("\033[33m⚠  Running DRY RUN first (showing first 10 images)\033[0m")
    upload_images(dry_run=True)
    
    # Ask user to confirm
    print("\n\033[36m=== Confirmation ===\033[0m")
    print("This will:")
    print("  1. Upload ALL images to Cloudinary")
    print("  2. Apply URL-friendly naming (lowercase, hyphens)")
    print("  3. Enable auto-optimization (quality='auto', format='auto')")
    print("  4. Organize in dashboard: stellar-blade/collectibles/{level}/{location}/")
    print("  5. Create url-mapping.json for update_urls.py")
    print("  6. Skip images already uploaded (idempotent)")
    print("\n\033[33mType 'yes' to proceed with upload:\033[0m ", end='')
    
    confirm = input().strip().lower()
    
    if confirm == 'yes':
        print()
        upload_images(dry_run=False)
    else:
        print("\n\033[90mCancelled - no images uploaded\033[0m")