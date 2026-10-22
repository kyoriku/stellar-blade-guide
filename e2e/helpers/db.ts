import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { PG_URL, REDIS_HOST, REDIS_PORT } from './guard';

const FIXTURE_FILE = path.join(__dirname, '..', '.fixtures.json');

// A section of the fixture walkthrough: a word only its text holds, and the id the
// section has on the page, which is where search links that word.
export interface FixtureSection {
  word: string;
  anchor: string;
}

export interface Fixtures {
  token: string;
  levelCreated: boolean;
  levelId: number;
  locationId: number;
  collectibleId: number;
  collectibleTitle: string;
  walkthroughId: number;
  walkthroughSlug: string;
  walkthroughTitle: string;
  titledSection: FixtureSection;
  untitledSection: FixtureSection;
  baseline: { collectibles: number; walkthroughs: number };
}

export function makeToken(): string {
  return `zqx${Date.now().toString(36)}`;
}

export function pgPool(): Pool {
  return new Pool({ connectionString: PG_URL, max: 2 });
}

export function redisClient(): Redis {
  return new Redis({ host: REDIS_HOST, port: REDIS_PORT, lazyConnect: false });
}

// The Redis key of a search response, as search_cache_key (server/app/core/cache.py)
// builds it for the client's limit of 20. `q` is the query as the server normalizes
// it: for the text specs type, trimmed and lowercased.
export function searchKey(q: string): string {
  return `search:${q}:20:v3`;
}

// Every cached search whose query holds the run token, at any limit or key version.
async function delSearchKeys(redis: Redis, token: string): Promise<number> {
  let cursor = '0';
  let deleted = 0;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', `search:*${token}*`, 'COUNT', 200);
    cursor = next;
    if (keys.length) deleted += await redis.del(...keys);
  } while (cursor !== '0');
  return deleted;
}

async function invalidateContentKeys(redis: Redis, walkthroughSlug: string): Promise<void> {
  await redis.del(
    'collectibles:level:eidos-7',
    'walkthroughs:all',
    `walkthrough:e2e-fixture:${walkthroughSlug}`,
  );
}

// The fixture's description carries a wikilink, so the structured-data spec can
// check that JSON-LD gets the text a reader sees, not the markup.
export const FIXTURE_DESCRIPTION = 'End-to-end fixture item by the [[levels/eidos-7|Eidos 7 page]].';
export const FIXTURE_DESCRIPTION_TEXT = 'End-to-end fixture item by the Eidos 7 page.';

export async function createFixtures(token: string): Promise<Fixtures> {
  const pool = pgPool();
  const redis = redisClient();
  try {
    // Fail with a clear message if seed_db.py has never run (no tables).
    try {
      await pool.query('SELECT 1 FROM levels LIMIT 1');
    } catch {
      throw new Error(
        'Postgres has no app tables. Run once: cd server && uv run python scripts/db/seed_db.py'
      );
    }

    const baseline = {
      collectibles: Number((await pool.query('SELECT count(*) FROM collectibles')).rows[0].count),
      walkthroughs: Number((await pool.query('SELECT count(*) FROM walkthroughs')).rows[0].count),
    };

    // Collectible must live under a level the client's hardcoded constants accept.
    // All inserts use explicit MAX(id)+1: the seed scripts insert explicit ids
    // without resetting sequences (walkthroughs_id_seq sits at 1 vs MAX(id) 306
    // locally), so relying on serial defaults collides on the primary key.
    // Safe here: workers=1, single setup, no concurrent writers.
    let levelCreated = false;
    let levelId: number;
    const existing = await pool.query(`SELECT id FROM levels WHERE name = 'Eidos 7'`);
    if (existing.rows.length) {
      levelId = existing.rows[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO levels (id, name, display_order)
         VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM levels), 'Eidos 7', 999) RETURNING id`
      );
      levelId = ins.rows[0].id;
      levelCreated = true;
    }

    const loc = await pool.query(
      `INSERT INTO locations (id, level_id, name, display_order)
       VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM locations), $1, $2, 999) RETURNING id`,
      [levelId, `E2E Fixture ${token}`]
    );
    const locationId = loc.rows[0].id;

    const collectibleTitle = `E2E ${token} collectible`;
    const col = await pool.query(
      `INSERT INTO collectibles (id, location_id, title, description, display_order)
       VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM collectibles), $1, $2, $3::jsonb, 1) RETURNING id`,
      [locationId, collectibleTitle, JSON.stringify({ type: 'text', content: FIXTURE_DESCRIPTION })]
    );
    const collectibleId = col.rows[0].id;

    // mission_type must not end in 's' (the walkthrough route de-pluralizes the URL segment).
    const walkthroughSlug = `e2e-${token}`;
    const walkthroughTitle = `E2E ${token} walkthrough`;
    // A titled section and an untitled one, so search can be seen linking a word in a
    // walkthrough's text to the section holding it: a titled section's id is its title's
    // slug, an untitled one's section-{order}. Each word starts with letters (a word
    // starting with digits can parse as a number: "3e5..." splits in two), then the run
    // token's last three characters, so its first five characters are this run's alone.
    // It still holds the run token, which cleanup and the residue check look for.
    const titledSection: FixtureSection = { word: `vq${token.slice(-3)}${token}`, anchor: 'e2e-fixtures-section' };
    const untitledSection: FixtureSection = { word: `vu${token.slice(-3)}${token}`, anchor: 'section-2' };
    const content = [
      { order: 1, section_title: "E2E Fixture's Section", text: `E2E fixture step by ${titledSection.word}.` },
      { order: 2, text: `E2E fixture step by ${untitledSection.word}.` },
    ];
    const wt = await pool.query(
      `INSERT INTO walkthroughs (id, slug, title, mission_type, display_order, content)
       VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM walkthroughs), $1, $2, 'e2e-fixture', 999, $3::jsonb) RETURNING id`,
      [walkthroughSlug, walkthroughTitle, JSON.stringify(content)]
    );
    const walkthroughId = wt.rows[0].id;

    await invalidateContentKeys(redis, walkthroughSlug);

    const fx: Fixtures = {
      token, levelCreated, levelId, locationId, collectibleId, collectibleTitle,
      walkthroughId, walkthroughSlug, walkthroughTitle, titledSection, untitledSection, baseline,
    };
    fs.writeFileSync(FIXTURE_FILE, JSON.stringify(fx, null, 2));
    return fx;
  } finally {
    await pool.end();
    redis.disconnect();
  }
}

export function readFixtures(): Fixtures {
  return JSON.parse(fs.readFileSync(FIXTURE_FILE, 'utf-8')) as Fixtures;
}

// A comment by `username` on the fixture walkthrough, with a live reply by the same
// user, so deleting the parent leaves it as "[deleted]" instead of removing it.
// Comments are never seeded, so their sequence is in step and the ids are its own.
export async function createCommentThread(fx: Fixtures, username: string): Promise<{ parentId: number; replyId: number }> {
  const pool = pgPool();
  try {
    const insert = `INSERT INTO comments (user_id, content_type, content_id, parent_id, body, is_approved, is_deleted)
      VALUES ((SELECT id FROM users WHERE username = $1), 'walkthrough', $2, $3, $4, true, false) RETURNING id`;
    const parent = await pool.query(insert, [username, fx.walkthroughId, null, `E2E ${fx.token} comment`]);
    const parentId: number = parent.rows[0].id;
    const reply = await pool.query(insert, [username, fx.walkthroughId, parentId, `E2E ${fx.token} reply`]);
    return { parentId, replyId: reply.rows[0].id };
  } finally {
    await pool.end();
  }
}

// A deleted account leaves its comments behind (user_id SET NULL), so they go by
// what they are on.
export async function deleteFixtureComments(fx: Fixtures): Promise<void> {
  const pool = pgPool();
  try {
    await pool.query(`DELETE FROM comments WHERE content_type = 'walkthrough' AND content_id = $1`, [fx.walkthroughId]);
  } finally {
    await pool.end();
  }
}

export async function teardownFixtures(fx: Fixtures): Promise<string[]> {
  const pool = pgPool();
  const redis = redisClient();
  const report: string[] = [];
  try {
    // Leftover users (afterEach normally deletes them via the API); cascades user_progress.
    const users = await pool.query(`DELETE FROM users WHERE username LIKE $1`, [`e2e_${fx.token}%`]);
    if (users.rowCount) report.push(`deleted ${users.rowCount} leftover fixture user(s) via SQL`);

    const comments = await pool.query(
      `DELETE FROM comments WHERE content_type = 'walkthrough' AND content_id = $1`, [fx.walkthroughId]
    );
    if (comments.rowCount) report.push(`deleted ${comments.rowCount} leftover fixture comment(s) via SQL`);

    await pool.query(`DELETE FROM collectibles WHERE id = $1`, [fx.collectibleId]);
    await pool.query(`DELETE FROM locations WHERE id = $1`, [fx.locationId]);
    await pool.query(`DELETE FROM walkthroughs WHERE id = $1`, [fx.walkthroughId]);
    if (fx.levelCreated) await pool.query(`DELETE FROM levels WHERE id = $1`, [fx.levelId]);

    await invalidateContentKeys(redis, fx.walkthroughSlug);
    const searchDeleted = await delSearchKeys(redis, fx.token);
    if (searchDeleted) report.push(`deleted ${searchDeleted} cached search key(s)`);

    // Residue proof: nothing carrying the run token survives, seeded counts intact.
    const residue = await pool.query(
      `SELECT
         (SELECT count(*) FROM collectibles WHERE title LIKE '%' || $1 || '%') +
         (SELECT count(*) FROM locations    WHERE name  LIKE '%' || $1 || '%') +
         (SELECT count(*) FROM walkthroughs WHERE title LIKE '%' || $1 || '%' OR content::text LIKE '%' || $1 || '%') +
         (SELECT count(*) FROM users        WHERE username LIKE '%' || $1 || '%') +
         (SELECT count(*) FROM comments     WHERE content_type = 'walkthrough' AND content_id = $2) AS n`,
      [fx.token, fx.walkthroughId]
    );
    if (Number(residue.rows[0].n) !== 0) {
      throw new Error(`Fixture residue remains after teardown: ${residue.rows[0].n} row(s)`);
    }
    const after = {
      collectibles: Number((await pool.query('SELECT count(*) FROM collectibles')).rows[0].count),
      walkthroughs: Number((await pool.query('SELECT count(*) FROM walkthroughs')).rows[0].count),
    };
    if (after.collectibles !== fx.baseline.collectibles || after.walkthroughs !== fx.baseline.walkthroughs) {
      throw new Error(
        `Seeded content count drifted: collectibles ${fx.baseline.collectibles}→${after.collectibles}, ` +
        `walkthroughs ${fx.baseline.walkthroughs}→${after.walkthroughs}`
      );
    }
    report.push('residue check clean: 0 fixture rows remain, seeded counts unchanged');
    return report;
  } finally {
    await pool.end();
    redis.disconnect();
  }
}
