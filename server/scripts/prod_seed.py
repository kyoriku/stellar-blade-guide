# scripts/prod_seed.py
"""
Usage:
  uv run scripts/prod_seed.py

Requires PROD_DATABASE_URL, PROD_REDIS_URL, CLOUDFLARE_ZONE_ID and
CLOUDFLARE_API_TOKEN to be set in server/.env (gitignored). Exits before
doing anything if any are missing.
"""

import subprocess
import sys
import os
import re
import requests
from pathlib import Path

from dotenv import load_dotenv

# ANSI constants inlined (values match app/core/colours.py). No app import
# means no sys.path bootstrap for import sorters to hoist things above.
CYAN = "\033[36m"
GREEN = "\033[32m"
RED = "\033[31m"
RESET = "\033[0m"


load_dotenv(Path(__file__).parent.parent / ".env")

REQUIRED = ["PROD_DATABASE_URL", "PROD_REDIS_URL",
            "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN"]
missing = [n for n in REQUIRED if not os.getenv(n)]
if missing:
    print(f"{RED}Missing required environment variables: {', '.join(missing)}{RESET}")
    print("  → Set them in server/.env (gitignored)")
    sys.exit(1)

PROD_DATABASE_URL = os.environ["PROD_DATABASE_URL"]
PROD_REDIS_URL = os.environ["PROD_REDIS_URL"]
CLOUDFLARE_ZONE_ID = os.environ["CLOUDFLARE_ZONE_ID"]
CLOUDFLARE_API_TOKEN = os.environ["CLOUDFLARE_API_TOKEN"]

scripts_dir = Path(__file__).parent

STEPS = [
    ("Seeding prod collectibles database", [
     "uv", "run", "python", "scripts/db/seed_collectibles.py"]),
    ("Seeding prod walkthroughs database", [
     "uv", "run", "python", "scripts/db/seed_walkthroughs.py"]),
]


def _mask(url):
    return re.sub(r"//([^:/@]+):[^@]*@", r"//\1:*****@", url)


def purge_cloudflare_cache():
    label = "Purging Cloudflare cache"
    print(f"{CYAN}[RUNNING]{RESET} {label}")
    try:
        response = requests.post(
            f"https://api.cloudflare.com/client/v4/zones/{CLOUDFLARE_ZONE_ID}/purge_cache",
            headers={"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"},
            json={"purge_everything": True},
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
        if result.get("success"):
            print(f"{GREEN}[SUCCESS]{RESET} {label}\n")
        else:
            print(f"{RED}[FAILED]{RESET} {label}: {result.get('errors')}")
            print("  → Purge manually via Cloudflare dashboard\n")
    except Exception as e:
        print(f"{RED}[FAILED]{RESET} {label}: {e}")
        print("  → Purge manually via Cloudflare dashboard\n")


def main():
    print(f"\n{CYAN}--- Prod seed ---{RESET}")
    print(f"  Database: {_mask(PROD_DATABASE_URL)}")
    print(f"  Redis:    {_mask(PROD_REDIS_URL)}")
    answer = input(
        f"\nType {CYAN}seed prod{RESET} to continue: ").strip()
    if answer != "seed prod":
        print(f"{RED}Aborted: nothing was run{RESET}")
        sys.exit(1)
    print()

    env = os.environ.copy()
    env["DATABASE_URL"] = PROD_DATABASE_URL
    env["REDIS_URL"] = PROD_REDIS_URL

    for label, cmd in STEPS:
        print(f"{CYAN}[RUNNING]{RESET} {label}")
        result = subprocess.run(cmd, env=env, cwd=scripts_dir.parent)
        if result.returncode != 0:
            print(f"{RED}[FAILED]{RESET} {label}")
            sys.exit(1)
        print(f"{GREEN}[SUCCESS]{RESET} {label}\n")

    purge_cloudflare_cache()

    print(f"{GREEN}--- Prod seed complete ---{RESET}\n")


if __name__ == "__main__":
    main()
