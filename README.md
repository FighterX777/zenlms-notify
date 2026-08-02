# ZenLMS Test Notifier

Automated Telegram notifications for ZenLMS aptitude tests, running entirely on GitHub Actions — no server, no PC required.

---

## How It Works

A GitHub Actions workflow runs every 2 hours and:

1. Logs into ZenLMS using your credentials
2. Fetches your proctored tests
3. Compares them against the last known state (`state.json`)
4. Sends Telegram notifications for any changes
5. Commits the updated `state.json` back to the repo

---

## Notifications Sent

| Event | Trigger |
|---|---|
| 🎉 New test published | Test ID seen for the first time |
| ✅ Test is open | `canStart == true` or `open == true` |
| ⏰ Starts in 6 hours | 6 hours before `fixedStartAt` |
| ⏰ Starts in 1 hour | 1 hour before `fixedStartAt` |
| ⚠️ Ends in 6 hours | 6 hours before `expiresAt` |
| ⚠️ Ends in 1 hour | 1 hour before `expiresAt` |
| ❌ Missed test | `EXPIRED` + `attemptsUsed == 0` |
| 🔄 Deadline changed | `expiresAt` or `fixedStartAt` changed |

All notifications are sent **once only** — no duplicates.

---

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the **Bot Token** (looks like `123456789:ABCdef...`)
4. Start a chat with your new bot (send it any message)
5. Get your **Chat ID** by visiting:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   Look for `"chat":{"id": 123456789}` in the response.

   Alternatively, message **@userinfobot** on Telegram — it replies with your user ID.

### 2. Fork / Clone This Repository

```bash
git clone https://github.com/<you>/zenlms-test-notifier.git
cd zenlms-test-notifier
```

### 3. Add GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these four secrets:

| Secret | Value |
|---|---|
| `EMAIL` | Your ZenLMS login email |
| `PASSWORD` | Your ZenLMS password |
| `BOT_TOKEN` | Telegram bot token from BotFather |
| `CHAT_ID` | Your Telegram user/chat ID |

### 4. Enable Workflow Permissions

Go to **Settings** → **Actions** → **General** → **Workflow permissions**

Select **"Read and write permissions"** and save.

This allows the workflow to commit `state.json` back to the repo.

### 5. Push and Trigger

```bash
git push origin main
```

Then go to **Actions** → **Check ZenLMS Tests** → **Run workflow** to test it manually.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy and fill in your credentials
cp .env.example .env

# Run once (sends real Telegram messages)
npm run dev

# Dry-run (prints messages, does NOT send to Telegram)
npm run dry-run

# Debug mode (verbose logging)
npm run debug
```

---

## State Persistence

State is stored in `state.json` at the repo root. After each run, the workflow commits any changes back to the repo with the message `chore: update state [skip ci]`.

The `[skip ci]` tag prevents the commit from triggering another workflow run.

**Trade-offs of this approach:**

| Approach | Pros | Cons |
|---|---|---|
| Git commit (used here) | Zero cost, no extra services | Adds commits to history |
| GitHub Gist | Cleaner history | Needs extra token |
| External DB | Most robust | Costs money / extra setup |

The git commit approach is the simplest and most reliable for this use case.

---

## Project Structure

```
zenlms-test-notifier/
├── src/
│   ├── index.ts        # Entry point
│   ├── login.ts        # ZenLMS authentication
│   ├── fetchTests.ts   # API call to get tests
│   ├── compare.ts      # Change detection + notification logic
│   ├── telegram.ts     # Telegram message sender
│   ├── storage.ts      # Read/write state.json
│   ├── logger.ts       # Colored console logger
│   └── types.ts        # TypeScript interfaces
├── .github/
│   └── workflows/
│       └── check-tests.yml
├── state.json          # Persisted state (committed by workflow)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Troubleshooting

**No notifications received after first run**

- Check the Actions run logs for errors
- Verify all 4 secrets are set correctly
- Make sure you sent a message to your bot before trying (Telegram bots can't initiate conversations)

**"Missing environment variables" error**

- One or more GitHub Secrets are missing or misspelled

**"Login failed" error**

- Double-check `EMAIL` and `PASSWORD` secrets
- Try logging in manually at https://zenlms.online to confirm credentials

**State not being committed**

- Ensure workflow permissions are set to "Read and write" (see Setup step 4)

**Duplicate notifications**

- This shouldn't happen — each notification key is stored in `state.json`
- If it does, check if `state.json` is being committed correctly after each run

**Workflow not running on schedule**

- GitHub may delay scheduled workflows by up to 15–30 minutes under load
- Scheduled workflows on repos with no recent activity may be disabled by GitHub — just push a commit to re-enable them
