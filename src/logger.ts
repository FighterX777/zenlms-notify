const IS_DEBUG = process.env.DEBUG === 'true';

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const ts = () => new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

export const log = {
  info: (msg: string) => console.log(`${c.cyan}[INFO]${c.reset} ${ts()} ${msg}`),
  success: (msg: string) => console.log(`${c.green}[OK]${c.reset}   ${ts()} ${msg}`),
  warn: (msg: string) => console.log(`${c.yellow}[WARN]${c.reset} ${ts()} ${msg}`),
  error: (msg: string) => console.error(`${c.red}[ERR]${c.reset}  ${ts()} ${msg}`),
  debug: (msg: string) => { if (IS_DEBUG) console.log(`${c.gray}[DBG]${c.reset}  ${ts()} ${msg}`); },
};
