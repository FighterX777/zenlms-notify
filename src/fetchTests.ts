import { log } from './logger';
import { Test, FetchTestsResponse } from './types';

type HttpClient = ReturnType<typeof import('./login').createHttpClient>;

const TESTS_URL =
  'https://zenlms.online/api/student/proctored-tests?page=0&size=20&status=all&sort=createdAt&direction=desc';

export async function fetchTests(client: HttpClient, retries = 3): Promise<Test[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log.info(`Fetching tests (attempt ${attempt})...`);
      const res = await client.get<FetchTestsResponse>(TESTS_URL);
      log.success(`Fetched ${res.data.items.length} test(s).`);
      return res.data.items;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Fetch failed: ${msg}`);
      if (attempt === retries) throw new Error(`Failed to fetch tests after ${retries} attempts.`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  return [];
}
