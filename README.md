# WhatsApp Channel Forward

Branch: `feature/channel-forward`

Baileys bot focused on **channel → group** auto-forward (no games / mini-apps).

## Setup

```bash
npm install
# edit config.js — ownerNumber, pairNumber
npm start
```

Open the pairing page (port from `config.port`), pair with WhatsApp.

## Channel → group

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

## Note

Unofficial WhatsApp automation can risk the number. Keep volume low; only relay channels you’re allowed to share.


## KataBump / VPS one-file runner

```bash
# copy katabump.js to the server, edit phone/port if needed
node katabump.js
```

Defaults: branch `feature/channel-forward`, port `20299`, phone from `CONFIG.phone`.
Env overrides: `PHONE`, `PORT`, `BRANCH`, `REPO_URL`, `BOT_DIR`, `UPDATE_EVERY_MIN`.
