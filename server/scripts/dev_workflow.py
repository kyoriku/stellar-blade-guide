"""
Automated workflow script for adding content
Usage:
  uv run scripts/dev_workflow.py collectibles
  uv run scripts/dev_workflow.py walkthroughs

Every typed confirmation in it takes 'yes' (the upload and the URL swap; the prune gate asks
for 'prune'), and a step with nothing to do doesn't ask. Declining one stops the workflow
there, so the dev seed never runs on R2 URLs for files that were never uploaded, or on local
paths that work on dev and break on prod.
"""

import subprocess
import sys
from pathlib import Path

# A step's exit status when its typed confirmation was declined (upload_r2.py and
# update_r2_urls.py).
EXIT_DECLINED = 3


def run_command(cmd, description):
    """Run one step. Returns its exit status."""
    print(f"\n\033[36m[RUNNING]\033[0m {description}")
    print(f"Command: {' '.join(cmd)}")

    code = subprocess.run(cmd, cwd=Path.cwd()).returncode
    if code == 0:
        print(f"\033[32m[SUCCESS]\033[0m {description} - Complete")
    elif code == EXIT_DECLINED:
        print(f"\033[33m[STOPPED]\033[0m {description} - Declined")
    else:
        print(f"\033[31m[ERROR]\033[0m {description} - Failed with exit code {code}")
    return code

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
            "cmd": ["uv", "run", "python", "scripts/images/generate_variants.py"],
            "desc": "Generating R2 WebP variants"
        },
        {
            "cmd": ["uv", "run", "python", "scripts/images/upload_r2.py"],
            "desc": "Uploading staged images to R2"
        },
        {
            "cmd": ["uv", "run", "python", "scripts/images/update_r2_urls.py", content_type],
            "desc": f"Updating {content_type} JSON with R2 URLs"
        },
        {
            "cmd": ["uv", "run", "python", seed_cmd],
            "desc": f"Seeding {content_type} database"
        },
    ]
    
    for i, step in enumerate(steps, 1):
        print(f"\nStep {i}/{len(steps)}: {step['desc']}")

        code = run_command(step["cmd"], step["desc"])
        if code == EXIT_DECLINED:
            print(f"\n\033[33m[STOPPED]\033[0m You declined step {i}, so nothing after it ran. "
                  f"Run the workflow again when you're ready.")
            sys.exit(EXIT_DECLINED)
        if code != 0:
            print(f"\n\033[31m[FAILED]\033[0m Workflow stopped at step {i}")
            sys.exit(1)

    print(f"\n\033[32m[SUCCESS]\033[0m {content_type.title()} workflow complete!")

    # Prune ledger reminder: masters pruned during generate_variants leave
    # their bucket objects pending until prod references the new state.
    ledger = Path("scripts/images/prune-pending.json")
    if ledger.exists():
        import json
        pending = json.loads(ledger.read_text())
        if pending:
            print(f"\n\033[33m[PENDING]\033[0m {len(pending)} pruned image(s) still have bucket objects.")
            print("After prod_seed.py, run: uv run python scripts/images/prune_bucket.py")

if __name__ == "__main__":
    main()