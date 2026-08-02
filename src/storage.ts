import * as fs from 'fs';
import * as path from 'path';
import { StoredState } from './types';
import { log } from './logger';

// state.json lives at the repo root so it can be committed back by the workflow
const STATE_FILE = path.resolve(process.cwd(), 'state.json');

const EMPTY_STATE: StoredState = { tests: {} };

export function loadState(): StoredState {
  if (!fs.existsSync(STATE_FILE)) {
    log.info('No state file found, starting fresh.');
    return structuredClone(EMPTY_STATE);
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as StoredState;
  } catch {
    log.warn('State file corrupted, starting fresh.');
    return structuredClone(EMPTY_STATE);
  }
}

export function saveState(state: StoredState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  log.debug(`State saved to ${STATE_FILE}`);
}
