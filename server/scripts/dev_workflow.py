# """
# Automated workflow script for adding collectibles
# Run from server/ directory after adding images and JSON files
# """

# import subprocess
# import sys
# from pathlib import Path

# def run_command(cmd, description):
#     """Run a command and handle errors"""
#     print(f"\n\033[36m[RUNNING]\033[0m {description}")
#     print(f"Command: {' '.join(cmd)}")
    
#     try:
#         result = subprocess.run(cmd, check=True, cwd=Path.cwd())
#         print(f"\033[32m[SUCCESS]\033[0m {description} - Complete")
#         return True
#     except subprocess.CalledProcessError as e:
#         print(f"\033[31m[ERROR]\033[0m {description} - Failed with exit code {e.returncode}")
#         return False

# def main():
#     print("Starting Collectibles Workflow")
#     print("=" * 50)
    
#     # Check we're in the right directory
#     if not Path("scripts").exists():
#         print("\033[31m[ERROR]\033[0m Please run this script from the server/ directory")
#         sys.exit(1)
    
#     steps = [
#         # Step 1: Compress images
#         {
#             "cmd": ["uv", "run", "python", "scripts/images/compress_images.py"],
#             "desc": "Compressing images to 1080p"
#         },
        
#         # Step 2: Renumber IDs
#         {
#             "cmd": ["uv", "run", "python", "scripts/renumber_ids.py"], 
#             "desc": "Renumbering collectible IDs"
#         },
        
#         # Step 3: Upload to Cloudinary (interactive)
#         {
#             "cmd": ["uv", "run", "python", "scripts/images/upload_cloudinary.py", "collectibles"],
#             "desc": "Uploading images to Cloudinary"
#         },
        
#         # Step 4: Update URLs (interactive)
#         {
#             "cmd": ["uv", "run", "python", "scripts/images/update_urls.py", "collectibles"],
#             "desc": "Updating JSON with Cloudinary URLs"
#         },
        
#         # Step 5: Seed database
#         {
#             "cmd": ["uv", "run", "python", "scripts/db/seed_collectibles.py"],
#             "desc": "Seeding database with collectibles"
#         }
#     ]
    
#     # Run each step
#     for i, step in enumerate(steps, 1):
#         print(f"\nStep {i}/{len(steps)}: {step['desc']}")
        
#         if not run_command(step["cmd"], step["desc"]):
#             print(f"\n\033[31m[FAILED]\033[0m Workflow stopped at step {i}")
#             sys.exit(1)
    
#     print(f"\n\033[32m[SUCCESS]\033[0m Workflow complete!")

# if __name__ == "__main__":
#     main()



"""
Automated workflow script for adding content
Usage:
  uv run python scripts/dev_workflow.py collectibles
  uv run python scripts/dev_workflow.py walkthroughs
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n\033[36m[RUNNING]\033[0m {description}")
    print(f"Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True, cwd=Path.cwd())
        print(f"\033[32m[SUCCESS]\033[0m {description} - Complete")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\033[31m[ERROR]\033[0m {description} - Failed with exit code {e.returncode}")
        return False

def main():
    # Parse content type argument
    if len(sys.argv) < 2 or sys.argv[1].lower() not in ['collectibles', 'walkthroughs']:
        print("\033[31m[ERROR]\033[0m Usage: python scripts/dev_workflow.py [collectibles|walkthroughs]")
        sys.exit(1)
    
    content_type = sys.argv[1].lower()
    
    print(f"Starting {content_type.title()} Workflow")
    print("=" * 50)
    
    # Check we're in the right directory
    if not Path("scripts").exists():
        print("\033[31m[ERROR]\033[0m Please run this script from the server/ directory")
        sys.exit(1)
    
    seed_cmd = (
        "scripts/db/seed_collectibles.py" if content_type == "collectibles"
        else "scripts/db/seed_walkthroughs.py"
    )
    
    steps = [
        {
            "cmd": ["uv", "run", "python", "scripts/images/compress_images.py"],
            "desc": "Compressing images to 1080p"
        },
        {
            "cmd": ["uv", "run", "python", "scripts/images/upload_cloudinary.py", content_type],
            "desc": f"Uploading {content_type} images to Cloudinary"
        },
        {
            "cmd": ["uv", "run", "python", "scripts/images/update_urls.py", content_type],
            "desc": f"Updating {content_type} JSON with Cloudinary URLs"
        },
        {
            "cmd": ["uv", "run", "python", seed_cmd],
            "desc": f"Seeding {content_type} database"
        },
    ]
    
    for i, step in enumerate(steps, 1):
        print(f"\nStep {i}/{len(steps)}: {step['desc']}")
        
        if not run_command(step["cmd"], step["desc"]):
            print(f"\n\033[31m[FAILED]\033[0m Workflow stopped at step {i}")
            sys.exit(1)
    
    print(f"\n\033[32m[SUCCESS]\033[0m {content_type.title()} workflow complete!")

if __name__ == "__main__":
    main()