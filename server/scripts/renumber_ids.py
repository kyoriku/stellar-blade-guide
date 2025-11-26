# # # import json
# # # import glob
# # # from pathlib import Path

# # # def renumber_collectibles():
# # #     seed_dir = Path('seed-data/collectibles')
# # #     all_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
# # #     current_id = 1
    
# # #     for json_file in all_files:
# # #         with open(json_file, 'r', encoding='utf-8') as f:
# # #             data = json.load(f)
        
# # #         for item in data:
# # #             item['id'] = current_id
# # #             current_id += 1
        
# # #         with open(json_file, 'w', encoding='utf-8') as f:
# # #             json.dump(data, f, indent=2, ensure_ascii=False)
        
# # #         print(f"✓ {json_file}: {len(data)} items renumbered")
    
# # #     print(f"\n✓ Total collectibles: {current_id - 1}")

# # # if __name__ == "__main__":
# # #     renumber_collectibles()

# # import json
# # import glob
# # from pathlib import Path

# # def renumber_all_collectibles():
# #     """Renumber all collectible IDs sequentially across all files"""
    
# #     project_root = Path(__file__).parent.parent
# #     seed_dir = project_root / 'seed-data' / 'collectibles'
    
# #     if not seed_dir.exists():
# #         print(f"\033[31m✗ Directory not found: {seed_dir}\033[0m")
# #         return
    
# #     # Get all JSON files in sorted order (by level folder, then file)
# #     json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
# #     print(f"Found {len(json_files)} JSON files\n")
    
# #     current_id = 1
# #     total_items = 0
# #     updated_files = 0
    
# #     for json_file in json_files:
# #         file_path = Path(json_file)
        
# #         # Read the file
# #         with open(file_path, 'r', encoding='utf-8') as f:
# #             data = json.load(f)
        
# #         # Track changes
# #         changed = False
        
# #         # Renumber each collectible
# #         for item in data:
# #             old_id = item.get('id')
# #             item['id'] = current_id
            
# #             if old_id != current_id:
# #                 changed = True
            
# #             current_id += 1
# #             total_items += 1
        
# #         # Write back only if changed
# #         if changed:
# #             with open(file_path, 'w', encoding='utf-8') as f:
# #                 json.dump(data, f, indent=2, ensure_ascii=False)
            
# #             rel_path = file_path.relative_to(seed_dir)
# #             print(f"✓ {rel_path}: {len(data)} items (IDs updated)")
# #             updated_files += 1
# #         else:
# #             rel_path = file_path.relative_to(seed_dir)
# #             print(f"  {rel_path}: {len(data)} items (unchanged)")
    
# #     print(f"\n{'='*60}")
# #     print(f"✓ Renumbering complete")
# #     print(f"  Total collectibles: {total_items}")
# #     print(f"  Files updated: {updated_files}")
# #     print(f"  Files unchanged: {len(json_files) - updated_files}")
# #     print(f"  Next available ID: {current_id}")
# #     print(f"{'='*60}")


# # if __name__ == "__main__":
# #     print("Renumbering all collectible IDs...\n")
# #     renumber_all_collectibles()

# import json
# import glob
# from pathlib import Path

# def renumber_all_collectibles():
#     """Renumber all collectible IDs sequentially across all files"""
    
#     project_root = Path(__file__).parent.parent
#     seed_dir = project_root / 'seed-data' / 'collectibles'
    
#     if not seed_dir.exists():
#         print(f"\033[31m✗ Directory not found: {seed_dir}\033[0m")
#         return
    
#     # Get all JSON files in sorted order (maintains level/location order)
#     json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
#     print(f"Found {len(json_files)} JSON files\n")
    
#     current_id = 1
#     total_items = 0
#     updated_files = 0
    
#     for json_file in json_files:
#         file_path = Path(json_file)
        
#         # Read the file
#         with open(file_path, 'r', encoding='utf-8') as f:
#             data = json.load(f)
        
#         if not data:
#             continue
            
#         # Track if any IDs changed in this file
#         changed = False
#         old_ids = []
#         new_ids = []
        
#         # Renumber each collectible
#         for item in data:
#             old_id = item.get('id')
#             item['id'] = current_id
            
#             if old_id != current_id:
#                 changed = True
#                 old_ids.append(old_id)
#                 new_ids.append(current_id)
            
#             current_id += 1
#             total_items += 1
        
#         # Write back only if changed
#         if changed:
#             with open(file_path, 'w', encoding='utf-8') as f:
#                 json.dump(data, f, indent=2, ensure_ascii=False)
            
#             rel_path = file_path.relative_to(seed_dir)
#             print(f"✓ {rel_path}: {len(data)} items")
            
#             # Show first few ID changes as examples
#             if old_ids:
#                 examples = min(3, len(old_ids))
#                 for i in range(examples):
#                     print(f"    {old_ids[i]} → {new_ids[i]}")
#                 if len(old_ids) > examples:
#                     print(f"    ... and {len(old_ids) - examples} more")
            
#             updated_files += 1
#         else:
#             rel_path = file_path.relative_to(seed_dir)
#             print(f"  {rel_path}: {len(data)} items (unchanged)")
    
#     print(f"\n{'='*60}")
#     print(f"\033[32m✓ Renumbering complete\033[0m")
#     print(f"  Total collectibles: {total_items}")
#     print(f"  Files updated: {updated_files}")
#     print(f"  Files unchanged: {len(json_files) - updated_files}")
#     print(f"  Next available ID: {current_id}")
#     print(f"{'='*60}")


# if __name__ == "__main__":
#     print("Renumbering all collectible IDs...\n")
#     renumber_all_collectibles()

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
