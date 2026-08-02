import 'dotenv/config';
import { createHttpClient, login } from './login';
import { fetchTests } from './fetchTests';
import { compareAndNotify } from './compare';
import { loadState, saveState } from './storage';
import { log } from './logger';

async function main() {
  log.info('=== ZenLMS Test Notifier starting ===');

  const required = ['EMAIL', 'PASSWORD', 'BOT_TOKEN', 'CHAT_ID'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    log.error(`Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const client = createHttpClient();
  await login(client);

  const tests = await fetchTests(client);
  if (!tests.length) {
    log.warn('No tests returned from API.');
    return;
  }

  const state = loadState();
  await compareAndNotify(tests, state);
  saveState(state);

  log.info('=== Done ===');
}

main().catch(err => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
