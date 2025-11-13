import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import glob
from pathlib import Path

def update_urls():
    """
    Update all JSON seed files with Cloudinary URLs using the mapping file.
    """
    
    # Load URL mapping
    mapping_file = Path(__file__).parent / 'url-mapping.json'
    
    if not mapping_file.exists():
        print("❌ url-mapping.json not found!")
        print("   Run upload-to-cloudinary.py first")
        return
    
    with open(mapping_file, 'r', encoding='utf-8') as f:
        url_mapping = json.load(f)
    
    print(f"📂 Loaded {len(url_mapping)} URL mappings\n")
    
    # Get all seed JSON files
    seed_dir = Path(__file__).parent.parent / 'seed-data'
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
    print(f"📂 Found {len(json_files)} JSON files to update\n")
    
    updated_files = 0
    updated_urls = 0
    
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_changed = False
        
        for item in data:
            for img in item.get('images', []):
                old_url = img['url']
                
                # Check if we have a Cloudinary URL for this
                if old_url in url_mapping:
                    img['url'] = url_mapping[old_url]
                    updated_urls += 1
                    file_changed = True
        
        # Write back if changed
        if file_changed:
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            updated_files += 1
            rel_path = Path(json_file).relative_to(seed_dir)
            print(f"✅ Updated: {rel_path}")
    
    print(f"\n✅ URL update complete!")
    print(f"   Files updated: {updated_files}")
    print(f"   URLs updated: {updated_urls}")
    print(f"\n⚠️  Next steps:")
    print(f"   1. Review the changes in seed-data/")
    print(f"   2. Run: python scripts/seed.py")
    print(f"   3. Test your website")

if __name__ == "__main__":
    update_urls()