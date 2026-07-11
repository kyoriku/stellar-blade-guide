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

1. `compress_images.py` : masters in `client/public/assets/images/<Dir>/` to
   `<Dir>_1080p/` siblings (max 1920x1080 JPEG q85, skips existing outputs).
   Unchanged from the Cloudinary era.
2. `fetch_cloudinary_assets.py` : one-shot migration tool (Phase 0). Downloaded
   the 3 assets that existed only in Cloudinary (home hero, Blood Rain hero,
   homepage banner) plus the rendered og card into
   `client/public/assets/images/Site/`.
3. `generate_variants.py` : reads every image in the `*_1080p` trees plus
   `Site/`, writes all WebP files into `r2-staging/` at the repo root, laid out
   exactly as the final R2 keys. WebP quality 80, method 6, parallel encode.
   Idempotent: skips outputs that already exist. Asserts the staged file count
   matches the expected count and cross-checks sources against
   `url-mapping.json` (a source missing from the mapping is fine only for
   brand-new content that was never on Cloudinary).
4. `upload_r2.py` (added in Phase 2) : uploads `r2-staging/` to the
   `stellar-blade-guide-images` bucket with correct Content-Type and
   Cache-Control headers, and writes `r2-url-mapping.json`
   (old Cloudinary URL to new R2 URL). Dry run first, typed confirmation.
5. `update_r2_urls.py` (added in Phase 4) : rewrites seed JSON (and
   `categoryImages.ts`) from `r2-url-mapping.json`. Dry run first; has a
   reverse mode that restores Cloudinary URLs.
6. Seeding is unchanged: `scripts/db/seed_collectibles.py` and
   `scripts/db/seed_walkthroughs.py` store whatever URLs the seed JSON holds
   and invalidate the Redis response cache.

## Adding new content (post-migration workflow)

1. Drop captures into the right masters folder under
   `client/public/assets/images/<Level>/<Location>/` (or `Walkthroughs/...`).
2. `uv run python scripts/images/compress_images.py`
3. `uv run python scripts/images/generate_variants.py` (only new files encode;
   existing staging is skipped)
4. `uv run python scripts/images/upload_r2.py` (dry run shows only the new
   objects; confirm to upload; r2-url-mapping.json gains the new entries)
5. Reference the new full-size R2 URL in seed JSON, then run the seeder.
   `update_r2_urls.py` can rewrite staged local `/assets/...` URLs for you the
   same way `update_urls.py` used to.

## Replacing an image (rename, never overwrite)

Because every URL is cached as immutable for a year, never re-upload different
bytes under an existing key. Instead:

1. Name the replacement capture with a new stem, for example
   `7_Crate_3_1b.jpg` next to the old `7_Crate_3_1.jpg`, or delete the old
   master and add the new one under a `-2` suffixed name.
2. Run compress, generate_variants, upload_r2 as for new content.
3. Point the seed JSON entry at the new full-size URL and re-seed.
4. The old R2 objects can be deleted whenever convenient; nothing references
   them after the re-seed and cache invalidation.

## Rollback, per migration phase

- Phase 0 (fetch script): delete `client/public/assets/images/Site/` and revert
  the commit. Nothing external changed.
- Phase 1 (this phase): delete `r2-staging/` and revert the commit. Nothing
  external changed.
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
