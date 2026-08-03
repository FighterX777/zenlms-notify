import axios from 'axios';
import { log } from './logger';

const BOT_TOKEN = process.env.BOT_TOKEN!;
const CHAT_ID = process.env.CHAT_ID!;
const DRY_RUN = process.env.DRY_RUN === 'true';

export async function sendTelegramMessage(message: string): Promise<void> {
  if (DRY_RUN) {
    log.warn(`[DRY-RUN] Would send:\n${message}`);
    return;
  }

  // Strip *bold* markers for plain text delivery — avoids all Markdown parsing errors
  const text = message.replace(/\*/g, '');

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await axios.post(url, { chat_id: CHAT_ID, text });
  log.success('Telegram message sent.');
}
