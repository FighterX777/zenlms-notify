import { Test, StoredState } from './types';
import { sendTelegramMessage } from './telegram';
import { log } from './logger';

const TZ = 'Asia/Kolkata';

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
  });
}

function minutesUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 60_000;
}

// ── Notification builders ─────────────────────────────────────────────────────

function msgNew(t: Test): string {
  return (
    `🎉 *New Aptitude Test*\n\n` +
    `*Title:* ${t.title}\n` +
    `*Subject:* ${t.subject}\n\n` +
    `*Starts:*\n${fmt(t.fixedStartAt)}\n\n` +
    `*Ends:*\n${fmt(t.expiresAt)}`
  );
}

function msgOpened(t: Test): string {
  return (
    `✅ *Test is Now Open!*\n\n` +
    `*${t.title}*\n` +
    `*Subject:* ${t.subject}\n\n` +
    `*Ends:* ${fmt(t.expiresAt)}\n\n` +
    `Go attempt it now!`
  );
}

function msgStartsSoon(t: Test, hours: number): string {
  return (
    `⏰ *Starts in ${hours} Hour${hours > 1 ? 's' : ''}*\n\n` +
    `*${t.title}*\n` +
    `*Subject:* ${t.subject}\n\n` +
    `*Starts:* ${fmt(t.fixedStartAt)}`
  );
}

function msgEndsSoon(t: Test, hours: number): string {
  return (
    `⚠️ *Ends in ${hours} Hour${hours > 1 ? 's' : ''}*\n\n` +
    `*${t.title}*\n` +
    `*Subject:* ${t.subject}\n\n` +
    `*Ends:* ${fmt(t.expiresAt)}`
  );
}

function msgMissed(t: Test): string {
  return (
    `❌ *Missed Test*\n\n` +
    `*${t.title}*\n` +
    `*Subject:* ${t.subject}\n\n` +
    `You missed this test.`
  );
}

function msgDeadlineChanged(t: Test, field: 'start' | 'end', oldVal: string, newVal: string): string {
  const label = field === 'start' ? '🔄 *Start Time Updated*' : '🔄 *Deadline Updated*';
  return (
    `${label}\n\n` +
    `*${t.title}*\n\n` +
    `*Old:* ${fmtDate(oldVal)}\n` +
    `*New:* ${fmtDate(newVal)}`
  );
}

// ── Main compare function ─────────────────────────────────────────────────────

export async function compareAndNotify(tests: Test[], state: StoredState): Promise<void> {
  for (const test of tests) {
    const prev = state.tests[test.id];
    const reminders = prev?.sentReminders ?? [];

    const send = async (key: string, msg: string) => {
      if (reminders.includes(key)) {
        log.debug(`[${test.title}] Skipping already-sent: ${key}`);
        return;
      }
      log.info(`[${test.title}] Sending notification: ${key}`);
      await sendTelegramMessage(msg);
      reminders.push(key);
    };

    // 1. New test
    if (!prev) {
      await send('new', msgNew(test));
      state.tests[test.id] = {
        fixedStartAt: test.fixedStartAt,
        expiresAt: test.expiresAt,
        sentReminders: reminders,
      };
      continue; // skip further checks on first sight
    }

    // Update stored state reference for this test
    state.tests[test.id].sentReminders = reminders;

    // 2. Deadline / start time changed
    if (prev.expiresAt !== test.expiresAt) {
      await send('deadline_changed', msgDeadlineChanged(test, 'end', prev.expiresAt, test.expiresAt));
      state.tests[test.id].expiresAt = test.expiresAt;
    }
    if (prev.fixedStartAt !== test.fixedStartAt) {
      await send('start_changed', msgDeadlineChanged(test, 'start', prev.fixedStartAt, test.fixedStartAt));
      state.tests[test.id].fixedStartAt = test.fixedStartAt;
    }

    // 3. Test opened
    if ((test.canStart || test.open) && test.attemptsUsed === 0) {
      await send('opened', msgOpened(test));
    }

    // 4. Starts soon reminders
    const minsToStart = minutesUntil(test.fixedStartAt);
    if (minsToStart > 0) {
      if (minsToStart <= 60) await send('start_1h', msgStartsSoon(test, 1));
      else if (minsToStart <= 360) await send('start_6h', msgStartsSoon(test, 6));
    }

    // 5. Ends soon reminders
    const minsToEnd = minutesUntil(test.expiresAt);
    if (minsToEnd > 0) {
      if (minsToEnd <= 60) await send('end_1h', msgEndsSoon(test, 1));
      else if (minsToEnd <= 360) await send('end_6h', msgEndsSoon(test, 6));
      else if (minsToEnd <= 720) await send('end_12h', msgEndsSoon(test, 12));
    }

    // 6. Missed test
    if (test.availabilityReason === 'EXPIRED' && test.attemptsUsed === 0) {
      await send('missed', msgMissed(test));
    }
  }
}
