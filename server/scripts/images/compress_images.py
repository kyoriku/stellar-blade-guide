from PIL import Image
import os
from pathlib import Path

def compress_to_1080p(input_folder, output_folder):
    """Compress images to 1080p max resolution (recursively)"""
    
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    count = 0
    skipped = 0
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(input_folder):
        for filename in files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                input_path = os.path.join(root, filename)
                
                # Recreate subdirectory structure in output
                rel_path = os.path.relpath(root, input_folder)
                output_dir = os.path.join(output_folder, rel_path)
                os.makedirs(output_dir, exist_ok=True)
                
                output_path = os.path.join(output_dir, filename)
                
                # Skip if output already exists
                if os.path.exists(output_path):
                    skipped += 1
                    continue
                
                try:
                    img = Image.open(input_path)
                    
                    # Only resize if larger than 1080p
                    if img.width > 1920 or img.height > 1080:
                        img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
                    
                    # Save with optimization
                    if filename.lower().endswith('.png'):
                        img.save(output_path, 'PNG', optimize=True)
                    else:
                        img.save(output_path, 'JPEG', quality=85, optimize=True)
                    
                    count += 1
                    print(f"✓ {filename}")
                except Exception as e:
                    print(f"✗ {filename}: {e}")
    
    print(f"Processed {count} images, skipped {skipped} existing")

if __name__ == "__main__":
    # Get the script's directory and build path from there
    script_dir = Path(__file__).parent.parent
    images_dir = script_dir / "../../client/public/assets/images"
    images_dir = images_dir.resolve()
    
    # Get all folders in images directory
    for folder_name in os.listdir(images_dir):
        folder_path = os.path.join(images_dir, folder_name)
        
        # Skip if not a directory
        if not os.path.isdir(folder_path):
            continue
        
        # Skip if already a 1080p folder
        if "_1080p" in folder_name:
            continue
        
        output_folder = os.path.join(images_dir, f"{folder_name}_1080p")
        
        print(f"\n{'='*60}")
        print(f"Processing: {folder_name}")
        print(f"{'='*60}")
        compress_to_1080p(folder_path, output_folder)