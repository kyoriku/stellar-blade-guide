import cloudinary
import cloudinary.api
from dotenv import load_dotenv
import os

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def delete_folder(folder_prefix):
    """Delete all resources with a given prefix"""
    try:
        result = cloudinary.api.delete_resources_by_prefix(folder_prefix)
        print(f"✓ Deleted resources from {folder_prefix}")
        print(f"  Deleted: {result.get('deleted', {})}")
    except Exception as e:
        print(f"✗ Error deleting {folder_prefix}: {e}")

if __name__ == "__main__":
    # Level folders (kebab-case for the bad duplicates)
    level_folders = [
        "wasteland",
        "eidos-9", 
        "eidos-7",
        "altess-levoire",
        "xion",
        "great-desert",
        "abyss-levoire",
        "matrix-11",
        "spire-4"
    ]
    
    # Delete stellar-blade/collectibles/* (good structure)
    print("Deleting stellar-blade/collectibles/...")
    delete_folder("stellar-blade/collectibles/")
    
    # Delete stellar-blade/{level}/* (bad duplicates without "collectibles")
    print("\nDeleting duplicate folder structures...")
    for folder in level_folders:
        print(f"\nDeleting stellar-blade/{folder}/...")
        delete_folder(f"stellar-blade/{folder}/")
    
    # Delete walkthroughs
    print(f"\nDeleting stellar-blade/walkthroughs/...")
    delete_folder("stellar-blade/walkthroughs/")
    
    print("\n✓ Done! stellar-blade/homepage untouched")