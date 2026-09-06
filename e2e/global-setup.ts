import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { assertLocalTargets } from './helpers/guard';
import { createFixtures, makeToken } from './helpers/db';

export default async function globalSetup(): Promise<void> {
  assertLocalTargets();

  // The server-meta spec fetches raw HTML from :8000, which serves the BUILT
  // dist. Rebuild when the dist shell is missing or predates the head-marker
  // change; the server re-reads the shell per request in DEBUG, so no uvicorn
  // restart is needed after the build.
  const clientDir = path.join(__dirname, '..', 'client');
  const distIndex = path.join(clientDir, 'dist', 'index.html');
  if (!fs.existsSync(distIndex) || !fs.readFileSync(distIndex, 'utf-8').includes('<!--seo-->')) {
    console.log('[e2e] client dist is stale (no <!--seo--> marker) — running npm run build');
    execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
  }
  const fx = await createFixtures(makeToken());
  console.log(
    `[e2e] fixtures ready: token=${fx.token} collectible=${fx.collectibleId} ` +
    `walkthrough=/walkthroughs/e2e-fixture/${fx.walkthroughSlug} (level pre-existed: ${!fx.levelCreated})`
  );
}
