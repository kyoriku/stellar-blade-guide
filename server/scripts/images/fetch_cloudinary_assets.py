import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cloudinary
import cloudinary.api
import urllib.request
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image, ImageChops

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# The 3 assets that exist only in Cloudinary (dashboard uploads, no local master),
# plus the rendered t_og_card of the banner. R2 keys for all of these will live
# under stellar-blade/site/ in Phase 2.
ASSETS = [
    {'public_id': 'stellar_blade2_c9qinq', 'filename': 'home-hero.jpg', 'min_width': 2560},
    {'public_id': 'Stellar_Blade_Blood_Rain_xipufx', 'filename': 'blood-rain-hero.jpg', 'min_width': 1600},
    {'public_id': 'stellar-blade/homepage/banner', 'filename': 'banner.jpg', 'min_width': None},
]

# Finished 1200x630 social card (t_og_card = c_fill,w_1200,h_630,f_webp,q_auto).
# Downloaded as rendered output because the named transform cannot be reproduced
# post-migration. Delivered bytes are webp despite the .jpg URL extension.
OG_RENDER_URL = 'https://res.cloudinary.com/{cloud}/image/upload/t_og_card/v1764288880/stellar-blade/homepage/banner.jpg'
OG_FILENAME = 'og-banner.webp'

# Local candidate for the home hero: referenced by no component, similar name,
# unverified. Pixel-compared against the downloaded original below.
LOCAL_HERO_CANDIDATE = 'stellar_blade2.jpg'


def download(url, dest):
    if dest.exists():
        print(f"\033[90m[SKIP] {dest.name} already exists\033[0m")
        return False
    req = urllib.request.Request(url, headers={'User-Agent': 'stellar-blade-guide-fetch/1.0'})
    with urllib.request.urlopen(req, timeout=60) as resp, open(dest, 'wb') as f:
        f.write(resp.read())
    return True


def compare_hero(local_path, downloaded_path):
    if not local_path.exists():
        print(f"\033[31m✗ Local candidate not found: {local_path}\033[0m")
        return
    if local_path.read_bytes() == downloaded_path.read_bytes():
        print(f"\033[32m✓ Pixel-compare verdict: IDENTICAL (byte-for-byte)\033[0m")
        return
    local_img = Image.open(local_path).convert('RGB')
    remote_img = Image.open(downloaded_path).convert('RGB')
    if local_img.size != remote_img.size:
        print(f"\033[31m✗ Pixel-compare verdict: MISMATCH — local {local_img.size[0]}x{local_img.size[1]} vs cloudinary {remote_img.size[0]}x{remote_img.size[1]}\033[0m")
        return
    diff = ImageChops.difference(local_img, remote_img)
    if diff.getbbox() is None:
        print(f"\033[32m✓ Pixel-compare verdict: PIXEL-IDENTICAL (same dimensions, same pixels)\033[0m")
        return
    hist = diff.histogram()
    total = sum(i * c for band in range(3) for i, c in enumerate(hist[band * 256:(band + 1) * 256]))
    pixels = local_img.size[0] * local_img.size[1] * 3
    extrema = diff.getextrema()
    max_diff = max(hi for _, hi in extrema)
    print(f"\033[33m⚠ Pixel-compare verdict: NEAR — same dimensions, mean channel diff {total / pixels:.2f}/255, max {max_diff}/255\033[0m")
    print(f"\033[90m    (re-encode-level differences are expected if the file was recompressed before upload)\033[0m")


def main():
    print("\033[36m=== Fetch Cloudinary-only Assets (Phase 0) ===\033[0m")
    print("\033[90mRead-only against Cloudinary: metadata + downloads, no writes anywhere.\033[0m\n")

    if not all([os.getenv('CLOUDINARY_CLOUD_NAME'), os.getenv('CLOUDINARY_API_KEY'), os.getenv('CLOUDINARY_API_SECRET')]):
        print("\033[31m✗ Cloudinary credentials not found in .env file!\033[0m")
        sys.exit(1)

    base_images_dir = Path(__file__).parent.parent.parent.parent / 'client' / 'public' / 'assets' / 'images'
    site_dir = base_images_dir / 'Site'
    site_dir.mkdir(parents=True, exist_ok=True)
    print(f"Destination: {site_dir}\n")

    errors = 0
    hero_path = None

    for asset in ASSETS:
        public_id = asset['public_id']
        dest = site_dir / asset['filename']
        try:
            resource = cloudinary.api.resource(public_id, resource_type='image')
            width, height = resource['width'], resource['height']
            fmt = resource['format']
            size_mb = resource.get('bytes', 0) / (1024 * 1024)
            print(f"\033[36m{public_id}\033[0m")
            print(f"    {width}x{height} {fmt} ({size_mb:.2f} MB)")
            if asset['min_width'] is not None:
                if width >= asset['min_width']:
                    print(f"\033[32m    ✓ width {width} >= required {asset['min_width']}\033[0m")
                else:
                    print(f"\033[33m    ⚠ width {width} < required {asset['min_width']} — serving above {width}px would upscale\033[0m")
            if download(resource['secure_url'], dest):
                print(f"\033[32m    ✓ saved {dest.name}\033[0m")
            if public_id == 'stellar_blade2_c9qinq':
                hero_path = dest
            print()
        except Exception as e:
            print(f"\033[31m✗ {public_id}: {e}\033[0m\n")
            errors += 1

    og_url = OG_RENDER_URL.format(cloud=os.getenv('CLOUDINARY_CLOUD_NAME'))
    og_dest = site_dir / OG_FILENAME
    try:
        print(f"\033[36mt_og_card render (homepage banner)\033[0m")
        if download(og_url, og_dest):
            print(f"\033[32m    ✓ saved {og_dest.name}\033[0m")
        og_img = Image.open(og_dest)
        print(f"    {og_img.size[0]}x{og_img.size[1]} {og_img.format.lower()}\n")
    except Exception as e:
        print(f"\033[31m✗ og render: {e}\033[0m\n")
        errors += 1

    if hero_path and hero_path.exists():
        print(f"\033[36mHero pixel-compare: {LOCAL_HERO_CANDIDATE} vs downloaded original\033[0m")
        compare_hero(base_images_dir / LOCAL_HERO_CANDIDATE, hero_path)
        print()

    print("\033[36m=== Summary ===\033[0m")
    on_disk = sorted(p.name for p in site_dir.iterdir() if p.is_file())
    print(f"Files in Site/: {len(on_disk)} — {', '.join(on_disk)}")
    if errors:
        print(f"\033[31m✗ Errors: {errors}\033[0m")
        sys.exit(1)
    print("\033[32m✓ Done\033[0m")


if __name__ == '__main__':
    main()
