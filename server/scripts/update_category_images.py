"""
Update categoryImages.ts with current Cloudinary URLs.
Fetches fresh URLs from Cloudinary API to get latest version numbers.
"""
import os
import re
from pathlib import Path
import cloudinary
import cloudinary.api
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

def extract_public_id(cloudinary_url):
    """
    Extract public_id from Cloudinary URL.
    Example: https://.../v1764281519/stellar-blade/collectibles/eidos-7/silent-street/1-passcode-r0ar0a-1.jpg
    Returns: stellar-blade/collectibles/eidos-7/silent-street/1-passcode-r0ar0a-1
    """
    match = re.search(r'/v\d+/(.+)$', cloudinary_url)
    if match:
        return match.group(1).replace('.jpg', '').replace('.png', '').replace('.webp', '').replace('.gif', '')
    return None

def get_current_url(public_id):
    """Get current Cloudinary URL for a public_id"""
    try:
        result = cloudinary.api.resource(public_id, resource_type='image')
        return result['secure_url']
    except Exception as e:
        print(f"Error fetching {public_id}: {e}")
        return None

def add_transformations(base_url, old_url):
    """
    Add transformations from old URL to new base URL.
    Old: https://.../upload/w_960,h_540,c_fill/f_auto,q_auto/v1764.../file.jpg
    New: https://.../upload/w_960,h_540,c_fill/f_auto,q_auto/v1765.../file.jpg
    """
    # Extract transformations from old URL
    transform_match = re.search(r'/upload/([^/]+(?:/[^/]+)?)/v\d+/', old_url)
    if transform_match:
        transformations = transform_match.group(1)
        # Insert into new URL
        return base_url.replace('/upload/', f'/upload/{transformations}/')
    return base_url

def update_category_images():
    """Update categoryImages.ts with fresh Cloudinary URLs"""
    
    # Path from server/ to client/src/constants/
    category_file = Path('../client/src/constants/categoryImages.ts')
    
    with open(category_file, 'r') as f:
        content = f.read()
    
    # Find all Cloudinary URLs (non-capturing group for extension)
    cloudinary_pattern = r'https://res\.cloudinary\.com/[^"\']+\.(?:jpg|png|gif|webp)'
    old_urls = re.findall(cloudinary_pattern, content)
    
    print(f"Found {len(old_urls)} Cloudinary URLs\n")
    
    updated_count = 0
    failed = []
    
    for old_url in old_urls:
        # Extract public_id
        public_id = extract_public_id(old_url)
        
        if not public_id:
            print(f"Could not extract public_id from: {old_url}")
            continue
        
        # Get current URL from Cloudinary
        print(f"Fetching: {public_id}...", end=' ')
        base_url = get_current_url(public_id)
        
        if not base_url:
            failed.append(public_id)
            print("FAILED")
            continue
        
        # Add transformations from old URL
        new_url = add_transformations(base_url, old_url)
        
        # Extract version numbers for display
        old_version = re.search(r'v(\d+)', old_url).group(1)
        new_version = re.search(r'v(\d+)', new_url).group(1)
        
        if old_version != new_version:
            # Replace in content
            content = content.replace(old_url, new_url)
            updated_count += 1
            print(f"✓ ({old_version} → {new_version})")
        else:
            print(f"✓ (already {new_version})")
    
    # Write updated content
    with open(category_file, 'w') as f:
        f.write(content)
    
    print("\n" + "="*60)
    print(f"✓ Updated {updated_count} URLs")
    
    if failed:
        print(f"\n{len(failed)} URLs failed to fetch:")
        for public_id in failed[:5]:
            print(f"  - {public_id}")
        if len(failed) > 5:
            print(f"  ... and {len(failed) - 5} more")
    
    print(f"\n✓ Updated file: {category_file}")

if __name__ == '__main__':
    print("=== Update Category Images with Fresh Cloudinary URLs ===\n")
    update_category_images()