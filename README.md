# WhatsApp Channel Forward

Branch: `feature/channel-forward`

Baileys bot focused on **channel → group/channel** auto-forward (no games / mini-apps).

## Setup

```bash
npm install
# edit config.js — ownerNumber, pairNumber
npm start
```

Open the pairing page (port from `config.port`), pair with WhatsApp.

## Channel → group/channel

### Channel id from post link

```text
.cfwd resolve https://whatsapp.com/channel/XXXX/123
```

### Add rule + bold footer

```text
.cfwd add https://whatsapp.com/channel/XXXX 120363…@g.us Dark News
```

Forwarded text becomes:

```text
original channel text

*Dark News*
```

### Commands (owner)

| Command | Meaning |
|---------|---------|
| `.cfwd help` | Guide |
| `.cfwd resolve <link>` | Channel `@newsletter` id |
| `.cfwd add <link\|jid> <groupJid> [footer]` | Add rule |
| `.cfwd footer <link\|jid> <text>` | Bold footer on new line |
| `.cfwd list` | Rules |
| `.cfwd remove <channel>` | Remove |
| `.cfwd log on\|off` | Log channel jids |
| `.cfwd last` | Last seen channel jid |
| `.id` | Chat / group id |
| `.send <jid> <text>` | Owner send |

Rules file: `data/channel-forwards.json`.

## Always-on / self-healing

The forwarder is built to keep running without manual restarts:

- Reconnects forever with backoff (2 s to 60 s). A failed start (network down, version lookup) retries by itself.
- A watchdog notices a silent connection (no successful channel fetch for 4 min) and reconnects; if it keeps happening, or the bot stays offline 8 min, it restarts the process (under `katabump.js`).
- A scan that hangs is abandoned after 2 min; one failing channel backs off without blocking the others.
- Posts that fail while offline stay queued (not counted as failed) and are sent after reconnecting.
- Only one copy per session: a newer bot stops an older one (two copies fight with code 440).
- `GET /health` shows state (`?strict=1` returns 503 while disconnected). `katabump.js` restarts the bot if `/health` stops answering.

Posts older than 1 hour are never forwarded (also after the bot was off for days); change with `CFWD_MAX_AGE_MIN`. Scan speed: `CFWD_SCAN_MS`.

Optional env: `MAX_RSS_MB` restarts on high memory; `KEEPALIVE_URL` (public URL) self-pings `/health` on hosts that sleep idle apps.

Check with `npm test`.

## Note

Unofficial WhatsApp automation can risk the number. Keep volume low; only relay channels you’re allowed to share.


## KataBump / VPS one-file runner

```bash
# copy katabump.js to the server, edit phone/port if needed
node katabump.js
```

Defaults: branch `feature/channel-forward`, port `20299`, phone from `CONFIG.phone`.
Env overrides: `PHONE`, `PORT`, `BRANCH`, `REPO_URL`, `BOT_DIR`, `UPDATE_EVERY_MIN`.

## Host layout (KataBump)

Runner lives at host root; bot code is isolated in `bot/`.

```
./index.js          # katabump runner
./forwards.json     # BACK UP — all channel rules, strips, footers
./session/          # WhatsApp login (do not delete)
./bot/              # app code (auto-updated from git)
```

Safe updates only refresh `./bot`. `forwards.json` and `session/` are never deleted by the runner.
