import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { log } from './logger';

export function createHttpClient() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));
  return client;
}

type HttpClient = ReturnType<typeof createHttpClient>;

export async function login(client: HttpClient, retries = 3): Promise<void> {
  const email = process.env.EMAIL!;
  const password = process.env.PASSWORD!;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log.info(`Logging in as ${email} (attempt ${attempt})...`);
      await client.post('https://zenlms.online/api/auth/login', { email, password });
      log.success('Login successful.');
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Login failed: ${msg}`);
      if (attempt === retries) throw new Error(`Login failed after ${retries} attempts.`);
      await sleep(2000 * attempt);
    }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
