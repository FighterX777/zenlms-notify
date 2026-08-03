import axios from 'axios';
import { log } from './logger';

const BOT_TOKEN = process.env.BOT_TOKEN!;
const CHAT_ID = process.env.CHAT_ID!;
const DRY_RUN = process.env.DRY_RUN === 'true';

// Escape special characters for Telegram MarkdownV2
function escape(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// Convert simple *bold* and \n to MarkdownV2, escaping everything else
function toMarkdownV2(message: string): string {
  return message
    .split(/\*([^*]+)\*/g)
    .map((part, i) => (i % 2 === 1 ? `*${escape(part)}*` : escape(part)))
    .join('');
}

export async function sendTelegramMessage(message: string): Promise<void> {
  if (DRY_RUN) {
    log.warn(`[DRY-RUN] Would send:\n${message}`);
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: CHAT_ID,
    text: toMarkdownV2(message),
    parse_mode: 'MarkdownV2',
  });
  log.success('Telegram message sent.');
}
