import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

# Uploads r2-staging/ to the R2 bucket 1:1 (staging layout == object keys).
# Immutable caching: objects are never overwritten; a changed image gets a new
# key (see PIPELINE.md "Replacing an image"). The one exception, --overwrite,
# replaces existing objects in place and then purges exactly those URLs at the
# edge, the only time anything purges an image.

STAGING_DIR = Path(__file__).parent.parent.parent.parent / 'r2-staging'

CACHE_CONTROL = 'public, max-age=31536000, immutable'
CONTENT_TYPE = 'image/webp'
UPLOAD_WORKERS = 16

# Exit status when the upload is declined: dev_workflow.py stops on it rather than going on to
# swap in R2 URLs for files that were never uploaded.
EXIT_DECLINED = 3


def get_client():
    return boto3.client(
        's3',
        endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
        region_name='auto',
        # boto3 >= 1.36 injects CRC32 checksums by default, which breaks some
        # S3-compatible endpoints.
        config=Config(request_checksum_calculation='when_required', max_pool_connections=UPLOAD_WORKERS * 2),
    )


def upload(dry_run=True, overwrite=False, replaced=None, plan=None):
    """Upload r2-staging/. In overwrite mode, `replaced` (a list) is filled before the first
    PUT with every key that already exists in the bucket: the URLs the edge must then purge.
    `plan` (a dict), when given, gets 'pending': how many files this run would upload."""
    start = time.perf_counter()
    bucket = os.getenv('R2_BUCKET')

    files = sorted(p for p in STAGING_DIR.rglob('*.webp'))
    print(f"\n\033[36m=== Scanning ===\033[0m")
    print(f"Staging: {STAGING_DIR}")
    print(f"Bucket: {bucket}")
    print(f"Staged files: \033[33m{len(files)}\033[0m\n")

    if not files:
        print("\033[31m✗ Nothing staged — run generate_variants.py first\033[0m")
        return False

    client = get_client()
    existing = set()
    token = None
    while True:
        kwargs = {'Bucket': bucket, 'MaxKeys': 1000}
        if token:
            kwargs['ContinuationToken'] = token
        resp = client.list_objects_v2(**kwargs)
        existing.update(obj['Key'] for obj in resp.get('Contents', []))
        if not resp.get('IsTruncated'):
            break
        token = resp.get('NextContinuationToken')
    print(f"\033[32m✓ Bucket currently holds {len(existing)} objects\033[0m\n")

    to_upload = [(f, f.relative_to(STAGING_DIR).as_posix()) for f in files]
    if overwrite:
        # One-shot replace-in-place mode (quality refreshes). Deliberate
        # exception to skip-if-in-bucket; URLs and headers are unchanged.
        pending = to_upload
        skipped = 0
        replacing = [key for _, key in to_upload if key in existing]
        if replaced is not None:
            replaced[:] = replacing
        print(f"\033[31m=== OVERWRITE MODE: {len(replacing)} existing objects will be replaced in place ({len(to_upload) - len(replacing)} new) ===\033[0m")
    else:
        pending = [(f, key) for f, key in to_upload if key not in existing]
        skipped = len(to_upload) - len(pending)
    if plan is not None:
        plan['pending'] = len(pending)

    if dry_run:
        print("\033[33m=== DRY RUN — no uploads will be performed ===\033[0m")
        verb = 'would REPLACE' if overwrite else 'would upload'
        for f, key in pending[:10]:
            print(f"\033[33m[DRY RUN] {verb}: {key} ({f.stat().st_size // 1024} KB)\033[0m")
        if len(pending) > 10:
            print(f"\033[90m... and {len(pending) - 10} more\033[0m")
        print(f"\n\033[33m[DRY RUN] Would {'replace' if overwrite else 'upload'}: {len(pending)}\033[0m")
        print(f"\033[90m[DRY RUN] Would skip (already in bucket): {skipped}\033[0m")
        print(f"Headers: Content-Type: {CONTENT_TYPE}; Cache-Control: {CACHE_CONTROL}")
        return True

    print(f"\033[36m=== Uploading {len(pending)} files ({UPLOAD_WORKERS} threads) ===\033[0m")
    uploaded, errors = 0, []

    def put(f, key):
        client.put_object(
            Bucket=bucket, Key=key, Body=f.read_bytes(),
            ContentType=CONTENT_TYPE, CacheControl=CACHE_CONTROL,
        )

    with ThreadPoolExecutor(max_workers=UPLOAD_WORKERS) as pool:
        futures = {pool.submit(put, f, key): key for f, key in pending}
        for future in as_completed(futures):
            key = futures[future]
            try:
                future.result()
                uploaded += 1
            except Exception as e:
                errors.append(f"{key}: {e}")
            done = uploaded + len(errors)
            if done % 500 == 0 or done == len(pending):
                print(f"\033[90m[{done}/{len(pending)}] {uploaded} uploaded, {len(errors)} errors ({time.perf_counter() - start:.0f}s)\033[0m")

    elapsed = time.perf_counter() - start
    print(f"\n\033[36m=== Summary ===\033[0m")
    print(f"\033[32m✓ Uploaded: {uploaded}\033[0m")
    print(f"\033[90m→ Skipped (already in bucket): {skipped}\033[0m")
    if errors:
        print(f"\033[31m✗ Errors: {len(errors)}\033[0m")
        for err in errors[:10]:
            print(f"\033[31m    {err}\033[0m")
    print(f"→ Time: {int(elapsed // 60)}m {int(elapsed % 60)}s")

    if errors:
        print("\033[31m✗ Re-run to retry failed uploads (existing objects are skipped)\033[0m")
        return False
    if uploaded + skipped != len(to_upload):
        print(f"\033[31m✗ Uploaded+skipped != staged — investigate\033[0m")
        return False
    print(f"\033[32m✓ Bucket matches staging ({len(to_upload)} objects)\033[0m")
    return True


def purge_replaced(keys):
    """Purge exactly the replaced objects' URLs at the edge. True when every one was purged.

    Only these URLs: nothing else in the image cache changed. Browsers that cached the old
    bytes keep them until their own cache expires (immutable, up to a year), which is why
    --overwrite is for quality-only refreshes and a content change gets a new name."""
    from scripts.cache.purge_api_cache import purge

    base = os.getenv('R2_PUBLIC_BASE_URL').rstrip('/')
    urls = [f"{base}/{key}" for key in sorted(keys)]
    print(f"\n\033[36m=== Purging the {len(urls)} replaced image URLs at the edge ===\033[0m")
    try:
        purged = purge(urls)
    except RuntimeError as e:   # TransientPurgeError, CloudflareRefused
        print(f"\033[31m✗ Purging the replaced image URLs failed: {e}. The edge keeps serving "
              f"their old bytes until a purge succeeds. Run upload_r2.py --overwrite again: it "
              f"uploads the same bytes and purges the same URLs.\033[0m")
        return False
    print(f"\033[32m✓ Purged {purged} replaced image URLs; nothing else was purged\033[0m")
    return True


def main(argv, ask=input):
    print("\033[36m=== R2 Upload Script ===\033[0m")

    overwrite = '--overwrite' in argv

    required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL']
    if overwrite:
        # Checked before anything uploads: replaced objects must be purged afterwards.
        required += ['CLOUDFLARE_ZONE_ID', 'CLOUDFLARE_API_TOKEN']
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        print(f"\033[31m✗ Missing env vars in .env: {', '.join(missing)}\033[0m")
        return 1

    plan = {}
    if not upload(dry_run=True, overwrite=overwrite, plan=plan):
        return 1
    if not plan['pending']:
        print("\n\033[90mNothing new to upload\033[0m")
        return 0

    print("\n\033[36m=== Confirmation ===\033[0m")
    if overwrite:
        print("OVERWRITE MODE: the objects listed above will be REPLACED IN PLACE.")
        print("URLs and headers are unchanged. After uploading, this purges exactly the replaced")
        print("URLs at the edge; browsers that cached them keep the old bytes until their cache")
        print("expires, so content changes must rename instead. If the run stops before it")
        print("reports that purge, run it again with --overwrite.")
        confirm_word = 'overwrite'
    else:
        print("This will upload the files listed above to R2 with immutable cache headers.")
        print("Existing objects are never overwritten.")
        confirm_word = 'yes'
    print(f"\n\033[33mType '{confirm_word}' to proceed:\033[0m ", end='')
    try:
        confirm = ask().strip().lower()
    except EOFError:
        confirm = ''

    if confirm != confirm_word:
        print("\n\033[90mCancelled - no files uploaded\033[0m")
        return EXIT_DECLINED
    print()
    replaced = []
    uploaded_ok = upload(dry_run=False, overwrite=overwrite, replaced=replaced)
    # Purged whatever each upload's outcome: a replaced object may have changed even if the
    # client saw an error, and purging one that didn't is harmless.
    purged_ok = purge_replaced(replaced) if overwrite and replaced else True
    return 0 if uploaded_ok and purged_ok else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
