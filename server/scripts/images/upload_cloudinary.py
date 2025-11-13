import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cloudinary
import cloudinary.uploader
from pathlib import Path
import json
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_images():
    """
    Upload all images from client/public/assets/images to Cloudinary.
    Preserves folder structure and creates a mapping file.
    """
    
    # Path to images directory
    images_dir = Path(__file__).parent.parent.parent / 'client' / 'public' / 'assets' / 'images'
    
    if not images_dir.exists():
        print(f"❌ Images directory not found: {images_dir}")
        return
    
    print(f"📂 Scanning images in: {images_dir}\n")
    
    # Find all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    image_files = []
    
    for ext in image_extensions:
        image_files.extend(images_dir.rglob(f'*{ext}'))
    
    print(f"Found {len(image_files)} images to upload\n")
    
    if len(image_files) == 0:
        print("❌ No images found!")
        return
    
    # Mapping of old path -> Cloudinary URL
    url_mapping = {}
    uploaded = 0
    skipped = 0
    errors = 0
    
    for img_path in sorted(image_files):
        try:
            # Get relative path from images directory
            rel_path = img_path.relative_to(images_dir)
            
            # Create public_id (folder structure on Cloudinary)
            # e.g., Eidos7/Silent-Street/1-Passcode.jpg -> stellar-blade/Eidos7/Silent-Street/1-Passcode
            public_id = f"stellar-blade/{rel_path.parent}/{rel_path.stem}"
            
            # Old URL format (what's currently in database)
            old_url = f"/assets/images/{rel_path.as_posix()}"
            
            print(f"⬆️  Uploading: {rel_path}")
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                str(img_path),
                public_id=public_id,
                folder="stellar-blade",
                resource_type="image",
                overwrite=False,  # Don't re-upload if already exists
                unique_filename=False,
                use_filename=True
            )
            
            # Get Cloudinary URL
            cloudinary_url = result['secure_url']
            
            # Store mapping
            url_mapping[old_url] = cloudinary_url
            
            uploaded += 1
            print(f"   ✅ {cloudinary_url}\n")
            
        except cloudinary.exceptions.Error as e:
            if 'already exists' in str(e):
                print(f"   ⏭️  Already exists, skipping\n")
                skipped += 1
            else:
                print(f"   ❌ Error: {e}\n")
                errors += 1
        except Exception as e:
            print(f"   ❌ Error: {e}\n")
            errors += 1
    
    # Save mapping to JSON file
    mapping_file = Path(__file__).parent / 'url-mapping.json'
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(url_mapping, f, indent=2)
    
    print(f"\n✅ Upload complete!")
    print(f"   Uploaded: {uploaded}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}")
    print(f"   Mapping saved to: {mapping_file}")

if __name__ == "__main__":
    print("🚀 Starting Cloudinary upload...\n")
    print("⚠️  This may take several minutes for 1000+ images\n")
    
    # Confirm credentials are set
    if not all([
        os.getenv('CLOUDINARY_CLOUD_NAME'),
        os.getenv('CLOUDINARY_API_KEY'),
        os.getenv('CLOUDINARY_API_SECRET')
    ]):
        print("❌ Cloudinary credentials not found in .env file!")
        print("   Make sure you have:")
        print("   - CLOUDINARY_CLOUD_NAME")
        print("   - CLOUDINARY_API_KEY")
        print("   - CLOUDINARY_API_SECRET")
        sys.exit(1)
    
    upload_images()