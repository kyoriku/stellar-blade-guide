# Image Pipeline (Cloudflare R2)

How site images get from a game capture to the browser, and how to work with the
pipeline without breaking anything. Written to be self-sufficient: assume no other
context. Status: being built out during the R2 migration; sections marked
"added in Phase N" describe scripts that land in later migration phases.

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

R2 object key = the Cloudinary public_id path this site already used, so keys are
deterministic from local file paths:

- Collectibles: `stellar-blade/collectibles/<level>/<location>/<file>`
- Walkthroughs: `stellar-blade/walkthroughs/<type>/<mission>/<file>`
- One-off site assets (heroes, og banner): `stellar-blade/site/<name>`

Path segments are the local path lowercased with underscores and spaces turned
into hyphens and `&` into `and` (see `derive_key` in `generate_variants.py`,
which mirrors `upload_cloudinary.py`).

Per source image, the staged/uploaded files are:

- `{key}.webp` : full size (the URL stored in seed data and the DB; also the
  lightbox image)
- `{key}-w640.webp`, `{key}-w960.webp`, `{key}-w1200.webp`, `{key}-w1600.webp` :
  srcSet width variants. Images narrower than a variant width get a full-size
  copy under that name so no srcSet candidate 404s.
- The home hero additionally has `-w1920` and `-w2560`.
- `stellar-blade/site/og-banner.webp` is a finished 1200x630 social card
  (the old Cloudinary `t_og_card` render) used only as the default og:image.

No version numbers appear anywhere in paths. Client code builds variant URLs by
inserting `-w{N}` before `.webp` (`client/src/utils/cloudinary.ts`).

## Scripts, in pipeline order

All run from `server/` with `uv run python scripts/images/<script>.py`.

The masters tree (`client/public/assets/images/<Level>/<Location>/`) is the
publication manifest: captures are curated BEFORE they enter it, and every
image present there is published by the pipeline. A stray file dropped into
the masters tree WILL publish. There is no intermediate compression step;
variants are encoded directly from the masters at native resolution
(uniformly 3840x2160 as of the 2026-07-12 refresh).

1. `generate_variants.py` : reads every image in the masters tree plus
   `Site/`, writes all WebP files into `r2-staging/` at the repo root, laid
   out exactly as the final R2 keys (full size at native resolution plus the
   width variants). WebP quality 80, method 6, parallel encode. Idempotent:
   skips outputs that already exist. Asserts the staged file count matches
   the expected count and runs two manifest checks that must both come back
   clean (any flag is fatal, exit 1). The seed-based check is the manifest
   invariant: every master is referenced by seed data or client constants,
   every reference resolves to a master, and no two masters derive the same
   R2 key; authored `/assets/images/...` paths count as valid references
   while a batch is mid-workflow (pre-swap). The legacy `url-mapping.json`
   cross-check runs in parallel until retirement (a source missing from the
   mapping is expected for brand-new content; a mapping entry with no master
   is fatal). `--retire-legacy-check` previews the post-retirement behavior
   by skipping the legacy check.
   `r2-staging/` is disposable: it is fully regenerable by this script, so
   it can be deleted at any time to reclaim disk.
2. `upload_r2.py` : uploads `r2-staging/` to the `stellar-blade-guide-images`
   bucket with correct Content-Type and Cache-Control headers, skipping keys
   already in the bucket, and writes `r2-url-mapping.json` (old Cloudinary URL
   to new R2 URL, migration-era assets only). Dry run first, typed
   confirmation. A separate `--overwrite` flag exists for sanctioned
   replace-in-place refreshes only (see "Replacing an image" for why this is
   never the default): it bypasses the skip, states the replacement count in
   the dry run, and requires typing `overwrite` instead of `yes`.
3. `update_r2_urls.py` : rewrites image URLs in seed JSON and
   `categoryImages.ts`. Dry run before every write. Three passes: Cloudinary
   URL to R2 URL via `r2-url-mapping.json` (version-agnostic, migration only),
   staged local `/assets/images/...` path to R2 URL by direct derivation (the
   permanent new-content path, guarded on the staged file existing in
   `r2-staging/`), and a reverse mode that restores Cloudinary URLs for
   migration entries.
4. Seeding is unchanged: `scripts/db/seed_collectibles.py` and
   `scripts/db/seed_walkthroughs.py` store whatever URLs the seed JSON holds
   and invalidate the Redis response cache.

Both mapping files (`url-mapping.json`, `r2-url-mapping.json`) are frozen
migration-era artifacts, and as of 2026-07-12 they are retired from the
manifest role: the manifest invariant is now masters to seed references,
checked by `generate_variants.py`, with the legacy mapping cross-check kept
running in parallel. They become deletable (not deleted) once one real
content batch ships with both checks agreeing; the gate is tracked in
`docs/DECOMMISSION.md`. New content never touches them: R2 URLs are a pure
function of the local path, so no mapping is needed going forward.

## Adding new content

1. Curate the keepers into the right masters folder under
   `client/public/assets/images/<Level>/<Location>/` (or `Walkthroughs/...`).
   Remember: presence in the masters tree IS the publication decision.
2. Write the seed JSON entries referencing the local staged paths:
   `"url": "/assets/images/<Level>/<Location>/<file>.jpg"`.
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
bytes under an existing key when the CONTENT changes. Instead:

1. Name the replacement capture with a new stem, for example
   `7_Crate_3_1b.jpg` next to the old `7_Crate_3_1.jpg`, or delete the old
   master and add the new one under a `-2` suffixed name.
2. Run generate_variants and upload_r2 as for new content.
3. Point the seed JSON entry at the new full-size URL and re-seed.
4. The old R2 objects can be deleted whenever convenient; nothing references
   them after the re-seed and cache invalidation.

One documented exception: on 2026-07-12 every object (originals and variants)
was deliberately re-encoded from the 4K masters and overwritten in place via
`upload_r2.py --overwrite`, followed by a zone-wide edge purge. That was safe
ONLY because the change was quality-only: a browser holding a stale cached
copy keeps showing the identical correct image until natural cache turnover.
Any change to what an image DEPICTS must still rename. The same refresh
retired the 1080p compression step (`compress_images.py` deleted; the
`*_1080p` trees removed) so the pipeline sources directly from masters.

## Rollback, per migration phase

Historical record of the 2026-07-11 migration; the phase tooling it names
(fetch script, compress step) has since been retired.

- Phase 0 (fetch script): delete `client/public/assets/images/Site/` and revert
  the commit. Nothing external changed.
- Phase 1 (variant generation): delete `r2-staging/` and revert the commit.
  Nothing external changed.
- Phase 2 (upload): empty the `stellar-blade-guide-images` bucket (or delete the
  uploaded prefixes) and delete `r2-url-mapping.json`. The site never referenced
  R2, so nothing user-facing changed.
- Phase 3 (client dual-scheme builder + CSP): revert the client commit and
  redeploy. Cloudinary URLs still flow through the old code path.
- Phase 4 (local data cutover): run `update_r2_urls.py` reverse mode to restore
  Cloudinary URLs in seed JSON and `categoryImages.ts`, then re-seed locally.
- Phase 5 (prod cutover): reverse mode, redeploy the previous client build, run
  `prod_seed.py` to re-seed prod and purge the Cloudflare edge. Cloudinary stays
  fully live until decommission, so rollback is always available.
