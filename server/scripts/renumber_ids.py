import json
import glob
from pathlib import Path

project_root = Path(__file__).parent.parent.parent

def renumber_all_collectibles():
    """Renumber ALL collectible IDs and display_orders sequentially across all JSON files"""
    seed_dir = project_root / 'server' / 'seed-data' / 'collectibles'
    
    if not seed_dir.exists():
        print("\033[31m✗ seed-data/collectibles directory not found!\033[0m")
        return
    
    # Get all JSON files in sorted order (by level/location path)
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
    if not json_files:
        print("\033[31m✗ No JSON files found in seed-data/collectibles/\033[0m")
        return
    
    print(f"\033[96mFound {len(json_files)} JSON files\033[0m\n")
    
    current_id = 1
    files_modified = 0
    files_with_issues = []
    total_collectibles = 0
    
    for json_file in json_files:
        file_path = Path(json_file)
        rel_path = file_path.relative_to(seed_dir)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            continue
        
        file_changed = False
        has_issues = False
        
        # Renumber both id and display_order for each collectible in this file
        for index, item in enumerate(data, start=1):
            old_id = item.get('id')
            old_display_order = item.get('display_order')
            expected_display_order = index
            
            # Check if ID needs updating
            if old_id != current_id:
                item['id'] = current_id
                file_changed = True
                has_issues = True
            
            # Check if display_order needs updating
            if old_display_order != expected_display_order:
                item['display_order'] = expected_display_order
                file_changed = True
                has_issues = True
            
            current_id += 1
            total_collectibles += 1
        
        # Only write if file changed
        if file_changed:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            files_modified += 1
            status = "\033[33m↻ Updated\033[0m" if has_issues else "\033[32m✓ Verified\033[0m"
            print(f"{status} {rel_path}")
            
            if has_issues:
                files_with_issues.append(str(rel_path))
    
    # Summary
    print(f"\n\033[92m{'='*60}\033[0m")
    print(f"\033[92m✓ Renumbering complete!\033[0m")
    print(f"\033[96mFiles processed: {len(json_files)}\033[0m")
    print(f"\033[96mFiles modified: {files_modified}\033[0m")
    print(f"\033[96mTotal collectibles: {total_collectibles}\033[0m")
    print(f"\033[96mNext available ID: {current_id}\033[0m")
    
    if files_with_issues:
        print(f"\n\033[33mFiles that had ID or display_order issues:\033[0m")
        for file in files_with_issues:
            print(f"   • {file}")
    
    print(f"\033[92m{'='*60}\033[0m\n")


if __name__ == "__main__":
    print("\n\033[96mStarting ID and display_order renumbering...\033[0m\n")
    renumber_all_collectibles()
    print("\033[92m✓ Done!\033[0m\n")
