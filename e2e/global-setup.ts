import { assertLocalTargets } from './helpers/guard';
import { createFixtures, makeToken } from './helpers/db';

export default async function globalSetup(): Promise<void> {
  assertLocalTargets();
  const fx = await createFixtures(makeToken());
  console.log(
    `[e2e] fixtures ready: token=${fx.token} collectible=${fx.collectibleId} ` +
    `walkthrough=/walkthroughs/e2e-fixture/${fx.walkthroughSlug} (level pre-existed: ${!fx.levelCreated})`
  );
}
