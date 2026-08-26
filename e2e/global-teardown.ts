import * as fs from 'fs';
import * as path from 'path';
import { readFixtures, teardownFixtures } from './helpers/db';

const FIXTURE_FILE = path.join(__dirname, '.fixtures.json');

export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(FIXTURE_FILE)) {
    console.log('[e2e] teardown: no fixture file (setup failed before writing it) — nothing to clean');
    return;
  }
  const fx = readFixtures();
  const report = await teardownFixtures(fx);
  fs.unlinkSync(FIXTURE_FILE);
  for (const line of report) console.log(`[e2e] teardown: ${line}`);
}
