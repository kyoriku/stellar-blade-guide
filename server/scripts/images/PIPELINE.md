# Image Pipeline (Cloudflare R2)

How site images get from a game capture to the browser, and how to work with the
pipeline without breaking anything. Written to be self-sufficient: assume no other
context.

## Why R2 and how caching works

Images are served as pre-generated static WebP files from Cloudflare R2 behind
`https://img.stellarbladeguide.com/`. There are no dynamic transforms: every size
the client can request exists as its own file, uploaded once with
`Cache-Control: public, max-age=31536000, immutable`.

`immutable` means browsers and the Cloudflare edge may cache a URL for up to a
year without ever revalidating. That is what makes the site cheap and fast, and it
has one hard consequence: **a URL's bytes can never change**. If an image needs to
be replaced, it gets a new filename (see "Replacing an image" below). Overwriting
an existing key would leave stale bytes cached at edges and in browsers for up to
a year with no way to purge browser caches.

## URL scheme

R2 object keys are deterministic from local file paths:

- Collectibles: `stellar-blade/collectibles/<level>/<location>/<file>`
- Walkthroughs: `stellar-blade/walkthroughs/<type>/<mission>/<file>`
- One-off site assets (heroes, og banner): `stellar-blade/site/<name>`

Path segments are the local path lowercased with underscores and spaces turned
into hyphens and `&` into `and` (see `derive_key` in `generate_variants.py`).

Per source image, the staged/uploaded files are:

- `{key}.webp` : full size (the URL stored in seed data and the DB; also the
  lightbox image)
- `{key}-w640.webp`, `{key}-w960.webp`, `{key}-w1200.webp`, `{key}-w1600.webp` :
  srcSet width variants. Images narrower than a variant width get a full-size
  copy under that name so no srcSet candidate 404s.
- The home hero additionally has `-w1920` and `-w2560`.
- `stellar-blade/site/og-banner.webp` is a finished 1200x630 social card
  used only as the default og:image.

No version numbers appear anywhere in paths. Client code builds variant URLs by
inserting `-w{N}` before `.webp` (`client/src/utils/image.ts`).

## Scripts, in pipeline order

All run from `server/` with `uv run python scripts/images/<script>.py`.

The masters tree (`client/public/assets/images/<Level>/<Location>/`) is the
publication manifest: captures are curated BEFORE they enter it, and every
image present there is published by the pipeline. A stray file dropped into
the masters tree WILL publish. There is no intermediate compression step;
variants are encoded directly from the masters at native resolution
(uniformly 3840x2160 as of the 2026-07-12 refresh). As of the 2026-07-15
timestamp rename, the library is uniformly PS5-timestamp-named
(`Stellar Blade_<YYYYMMDDHHMMSS>.jpg`); the two DLC promo images are the
documented exclusions (promo art, not captures).

1. `generate_variants.py` : reads every image in the masters tree plus
   `Site/`, writes all WebP files into `r2-staging/` at the repo root, laid
   out exactly as the final R2 keys (full size at native resolution plus the
   width variants). WebP quality 80, method 6, parallel encode. Idempotent:
   skips outputs that already exist. Asserts the staged file count matches
   the expected count and runs the manifest check, which must come back
   clean (any flag is fatal, exit 1): every master is referenced by seed
   data or client constants, every reference resolves to a master, and no
   two masters derive the same R2 key. Authored `/assets/images/...` paths
   count as valid references while a batch is mid-workflow (pre-swap).
   `r2-staging/` is disposable: it is fully regenerable by this script, so
   it can be deleted at any time to reclaim disk.
2. `upload_r2.py` : uploads `r2-staging/` to the `stellar-blade-guide-images`
   bucket with correct Content-Type and Cache-Control headers, skipping keys
   already in the bucket. Dry run first, typed confirmation. A separate
   `--overwrite` flag exists for sanctioned replace-in-place refreshes only
   (see "Replacing an image" for why this is never the default): it bypasses
   the skip, states the replacement count in the dry run, and requires typing
   `overwrite` instead of `yes`.
3. `update_r2_urls.py` : rewrites staged local `/assets/images/...` paths in
   seed JSON to R2 URLs by direct derivation, guarded on the staged file
   existing in `r2-staging/`. Dry run before every write. R2 URLs are a pure
   function of the local path, so no mapping is involved.
4. Seeding is unchanged: `scripts/db/seed_collectibles.py` and
   `scripts/db/seed_walkthroughs.py` store whatever URLs the seed JSON holds
   and invalidate the Redis response cache.

## Adding new content

1. Curate the keepers into the right masters folder under
   `client/public/assets/images/<Level>/<Location>/` (or `Walkthroughs/...`).
   Remember: presence in the masters tree IS the publication decision.
2. Write the seed JSON entries referencing the local staged paths:
   `"url": "/assets/images/<Level>/<Location>/<file>.jpg"`. Copy-paste
   authoring is fine: an absolute host path (macOS `/Users/...` or the
   devcontainer's `/workspaces/...`) containing
   `client/public/assets/images/` is accepted by every reader (seeders,
   manifest check, URL swap, missing-images report) and normalized to the
   canonical form; the authored file itself is canonicalized when
   `update_r2_urls.py` rewrites it to the R2 URL. Contract lives in
   `scripts/images/paths.py`.
3. `uv run python scripts/images/generate_variants.py` (only new files encode;
   existing staging is skipped)
4. `uv run python scripts/images/upload_r2.py` (dry run shows only the new
   objects; confirm to upload)
5. `uv run python scripts/images/update_r2_urls.py` (option 1): the staged-path
   pass turns the local paths into R2 URLs, derived from the path itself. Any
   path whose staged file is missing is reported and left untouched, which
   catches typos and skipped pipeline steps.
6. Run the seeder, then commit the seed-data repo.

Staged-path rewrites are one-way: the kebab-cased R2 URL cannot be turned back
into the original local path mechanically (case and underscores are lost).
Rollback for new content is reverting the seed JSON commit. If a
reverse-to-local tool is ever needed, local paths are recoverable from the
masters tree or the seed-data git history; no mapping is required, and no
such mode is being built.

## Replacing an image (rename, never overwrite)

Because every URL is cached as immutable for a year, never re-upload different
bytes under an existing key when the CONTENT changes. Since the 2026-07-15
timestamp rename this rule is satisfied by convention: a replacement is a new
capture, and a new capture always arrives under a new timestamp name, so
replacement-by-recapture auto-versions by construction. Instead:

1. Curate the replacement capture into the masters folder under its own
   timestamp name.
2. Point the seed JSON entry at the new capture (local path, any accepted
   form) and run the workflow. The old image is now unreferenced, so the
   prune gate below surfaces it in the same run.

## Removing images: the prune gate (two stages, never silent)

The manifest check treats an unreferenced master as fatal. When
`generate_variants.py` runs interactively (as it does inside `dev_workflow`),
that fatal stop becomes a gate instead: the unreferenced set is listed in
full (master path, derived key, and the 10 artifacts per image: 5 staged
files + 5 bucket objects), and typing `prune` deletes the master and staged
files, ledgers the bucket keys in `prune-pending.json` (gitignored
artifact), re-runs the check, and lets the workflow proceed. Declining, EOF,
or a non-interactive run keeps the fatal stop: one bad seed edit can never
destroy source files without a human reading the list.

Bucket objects are deliberately NOT deleted in that moment. Prod's database
still references the old URLs until `prod_seed.py` runs, so deleting them
would 404 live images (the immutable edge cache is unreliable protection).
The second stage runs after prod is reseeded:

    uv run python scripts/images/prune_bucket.py

It refuses to run (fatal, not a warning) if any ledgered key has become
referenced again, lists the pending objects, requires the same typed
`prune`, deletes in chunks with post-verification (bucket count re-derived,
zero residual), then clears the ledger. `dev_workflow` prints this command
whenever the ledger is non-empty, and `prod_seed.py` offers to invoke it
after a successful seed + purge.

## What a prod seed purges

`prod_seed.py` purges only the seeded API surface: every cached GET URL
under the six API prefixes, derived live by
`scripts/cache/purge_api_cache.py` (FastAPI route table x DB slugs x client
navigation constants, batched at the Pro plan's 30-URLs-per-call limit,
every response verified; `--dry-run` lists without purging). Images are
never purged: their URLs are immutable and content changes always rename,
so the ~10k-object image cache stays warm across seeds. Any enumeration or
purge failure falls back loudly to a full zone purge — partial purge is
never an outcome, because API responses carry s-maxage=30d and a missed URL
would serve stale for up to a month. `prod_seed.py --purge-all` forces the
old full-zone purge explicitly; use it if anything outside the API surface
must be flushed (for example after replacing a Site/ asset in place, which
should not happen, or if the scoped derivation is ever in doubt).

One documented exception: on 2026-07-12 every object (originals and variants)
was deliberately re-encoded from the 4K masters and overwritten in place via
`upload_r2.py --overwrite`, followed by a zone-wide edge purge. That was safe
ONLY because the change was quality-only: a browser holding a stale cached
copy keeps showing the identical correct image until natural cache turnover.
Any change to what an image DEPICTS must still rename. The same refresh
retired the 1080p compression step (`compress_images.py` deleted; the
`*_1080p` trees removed) so the pipeline sources directly from masters.
