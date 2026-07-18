import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

# Uploads r2-staging/ to the R2 bucket 1:1 (staging layout == object keys).
# Immutable caching: objects are never overwritten; a changed image gets a new
# key (see PIPELINE.md "Replacing an image").

STAGING_DIR = Path(__file__).parent.parent.parent.parent / 'r2-staging'

CACHE_CONTROL = 'public, max-age=31536000, immutable'
CONTENT_TYPE = 'image/webp'
UPLOAD_WORKERS = 16


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


def upload(dry_run=True, overwrite=False):
    start = time.time()
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
        replacing = sum(1 for _, key in to_upload if key in existing)
        print(f"\033[31m=== OVERWRITE MODE: {replacing} existing objects will be replaced in place ({len(to_upload) - replacing} new) ===\033[0m")
    else:
        pending = [(f, key) for f, key in to_upload if key not in existing]
        skipped = len(to_upload) - len(pending)

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
                print(f"\033[90m[{done}/{len(pending)}] {uploaded} uploaded, {len(errors)} errors ({time.time() - start:.0f}s)\033[0m")

    elapsed = time.time() - start
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


if __name__ == '__main__':
    print("\033[36m=== R2 Upload Script ===\033[0m")

    overwrite = '--overwrite' in sys.argv[1:]

    required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL']
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        print(f"\033[31m✗ Missing env vars in .env: {', '.join(missing)}\033[0m")
        sys.exit(1)

    if not upload(dry_run=True, overwrite=overwrite):
        sys.exit(1)

    print("\n\033[36m=== Confirmation ===\033[0m")
    if overwrite:
        print("OVERWRITE MODE: the objects listed above will be REPLACED IN PLACE.")
        print("URLs and headers are unchanged; edge/browser caches serve old bytes")
        print("until purged or naturally expired. Content changes must rename instead.")
        confirm_word = 'overwrite'
    else:
        print("This will upload the files listed above to R2 with immutable cache headers.")
        print("Existing objects are never overwritten.")
        confirm_word = 'yes'
    print(f"\n\033[33mType '{confirm_word}' to proceed:\033[0m ", end='')
    try:
        confirm = input().strip().lower()
    except EOFError:
        confirm = ''

    if confirm == confirm_word:
        print()
        if not upload(dry_run=False, overwrite=overwrite):
            sys.exit(1)
    else:
        print("\n\033[90mCancelled - no files uploaded\033[0m")
