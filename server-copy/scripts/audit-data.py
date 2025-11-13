# server/scripts/audit-data.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import glob
from pathlib import Path

def audit_collectibles():
    """Find potential issues in seed data"""
    
    seed_dir = Path(__file__).parent.parent / 'seed-data'
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
    issues = []
    total = 0
    
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for item in data:
            total += 1
            
            # Check for missing images
            if not item.get('images'):
                issues.append(f"❌ No images: {item['level']} / {item['location']} / {item['title']}")
            
            # Check for broken image paths
            for img in item.get('images', []):
                img_path = Path(__file__).parent.parent.parent / 'client' / 'public' / img['url'].lstrip('/')
                if not img_path.exists():
                    issues.append(f"❌ Missing file: {img['url']}")
            
            # Check for missing required fields
            if not item.get('title'):
                issues.append(f"❌ No title: {item['level']} / {item['location']}")
            
            if not item.get('description'):
                issues.append(f"❌ No description: {item['level']} / {item['location']} / {item['title']}")
    
    print(f"📊 Audit Results:")
    print(f"   Total collectibles: {total}")
    print(f"   Issues found: {len(issues)}\n")
    
    if issues:
        for issue in issues[:20]:  # Show first 20
            print(issue)
        if len(issues) > 20:
            print(f"\n... and {len(issues) - 20} more issues")
    else:
        print("✅ No issues found! Data looks good.")

if __name__ == "__main__":
    audit_collectibles()