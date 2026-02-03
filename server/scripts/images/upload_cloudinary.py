import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cloudinary
import cloudinary.uploader
import cloudinary.api
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

def upload_images(dry_run=True, content_type='all'):
    """
    Upload images from client/public/assets/images to Cloudinary.
    Preserves folder structure with URL-friendly naming.
    
    Args:
        dry_run: If True, show what would be uploaded without uploading
        content_type: 'collectibles', 'walkthroughs', or 'all'
    """
    
    start_time = time.time()
    
    # Base images directory
    base_images_dir = Path(__file__).parent.parent.parent.parent / 'client' / 'public' / 'assets' / 'images'
    
    # Determine target directory
    if content_type == 'collectibles':
        images_dir = base_images_dir / 'Collectibles'
        if not images_dir.exists():
            images_dir = base_images_dir  # Fallback to base if subfolder doesn't exist
    elif content_type == 'walkthroughs':
        images_dir = base_images_dir / 'Walkthroughs_1080p'
        if not images_dir.exists():
            print(f"\033[31m✗ Walkthroughs_1080p directory not found: {images_dir}\033[0m")
            return
    else:  # 'all'
        images_dir = base_images_dir
    
    if not images_dir.exists():
        print(f"\033[31m✗ Images directory not found: {images_dir}\033[0m")
        return
    
    print(f"\n\033[36m=== Scanning Images ===\033[0m")
    print(f"Directory: {images_dir}")
    print(f"Content type: {content_type}\n")
    
    # Find all image files - ONLY from _1080p folders
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    image_files = []
    
    for ext in image_extensions:
        for img_file in images_dir.rglob(f'*{ext}'):
            # Only include if path contains _1080p
            if '_1080p' in str(img_file):
                image_files.append(img_file)
    
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
            # Get relative path from BASE images directory (important!)
            rel_path = img_path.relative_to(base_images_dir)
            
            # Strip _1080p from path
            rel_path_str = str(rel_path).replace('_1080p', '')
            rel_path_clean = Path(rel_path_str)
            
            # Determine folder structure based on path
            # Collectibles/Eidos_7/Silent_Street/1_Image.jpg
            #   -> stellar-blade/collectibles/eidos-7/silent-street/1-image
            # Walkthroughs/Main_Story/7th_Airborne_Squad/Stellar Blade_20251127220623.jpg
            #   -> stellar-blade/walkthroughs/main-story/7th-airborne-squad/stellar-blade-20251127220623
            
            folder_path = rel_path_clean.parent.as_posix().replace('_', '-').replace(' ', '-').lower()
            filename = rel_path_clean.stem.replace('_', '-').replace(' ', '-').replace('&', 'and').lower()
            
            public_id = f"stellar-blade/{folder_path}/{filename}"
            asset_folder = f"stellar-blade/{folder_path}"
            
            # Old URL format (what's currently in database/JSON)
            old_url = f"/assets/images/{rel_path_clean.as_posix()}"
            
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
                # Image exists on Cloudinary - fetch its actual URL with version
                try:
                    resource = cloudinary.api.resource(public_id, resource_type="image")
                    cloudinary_url = resource['secure_url']
                    url_mapping[old_url] = cloudinary_url
                    print(f"\033[90m[{idx}/{total_images}] {rel_path}\033[0m")
                    print(f"\033[90m    → Already exists, fetched from Cloudinary\033[0m\n")
                    skipped += 1
                except Exception as fetch_error:
                    print(f"\033[31m[{idx}/{total_images}] ✗ {rel_path}\033[0m")
                    print(f"\033[31m    ✗ Error fetching existing resource: {fetch_error}\033[0m\n")
                    errors += 1
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
    
    # Check command-line argument
    content_type = 'all'
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ['collectibles', 'walkthroughs', 'all']:
            content_type = arg
        else:
            print(f"\033[31m✗ Invalid argument: {sys.argv[1]}\033[0m")
            print("Usage: python upload_cloudinary.py [collectibles|walkthroughs|all]")
            sys.exit(1)
    
    # Run dry run first
    print(f"\033[33m⚠  Running DRY RUN for: {content_type} (showing first 10 images)\033[0m")
    upload_images(dry_run=True, content_type=content_type)
    
    # Ask user to confirm
    print("\n\033[36m=== Confirmation ===\033[0m")
    print("This will:")
    print(f"  1. Upload NEW {content_type.upper()} images to Cloudinary")
    print("  2. Apply URL-friendly naming (lowercase, hyphens)")
    print("  3. Enable auto-optimization (quality='auto', format='auto')")
    print(f"  4. Organize in dashboard: stellar-blade/{content_type}/...")
    print("  5. Update url-mapping.json")
    print("  6. Skip existing images (overwrite=False)")
    print("\n\033[33mType 'yes' to proceed with upload:\033[0m ", end='')
    
    confirm = input().strip().lower()
    
    if confirm == 'yes':
        print()
        upload_images(dry_run=False, content_type=content_type)
    else:
        print("\n\033[90mCancelled - no images uploaded\033[0m")