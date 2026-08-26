// Hard safety rail: every target this suite touches must be the local
// devcontainer stack. Values are HARDCODED on purpose — never read from env
// or any .env file (server/.env contains live PROD_* connection strings).

export const BASE_URL = 'http://localhost:3000';
export const PG_URL = 'postgresql://postgres:postgres@postgres:5432/stellarblade';
export const REDIS_HOST = 'redis';
export const REDIS_PORT = 6379;

export function assertLocalTargets(): void {
  if (!/^http:\/\/localhost(:\d+)?$/.test(BASE_URL)) {
    throw new Error(`Refusing to run: baseURL is not localhost: ${BASE_URL}`);
  }
  const pg = new URL(PG_URL);
  if (pg.hostname !== 'postgres' || pg.port !== '5432') {
    throw new Error(`Refusing to run: Postgres target is not the compose-internal service: ${pg.hostname}:${pg.port}`);
  }
  if (REDIS_HOST !== 'redis' || REDIS_PORT !== 6379) {
    throw new Error(`Refusing to run: Redis target is not the compose-internal service: ${REDIS_HOST}:${REDIS_PORT}`);
  }
  for (const key of ['DATABASE_URL', 'REDIS_URL']) {
    const val = process.env[key];
    if (val && /railway|rlwy|proxy|amazonaws|prod/i.test(val)) {
      throw new Error(`Refusing to run: ${key} in the environment looks remote. This suite is local-only.`);
    }
  }
}
