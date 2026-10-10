# WhatsApp MiniBot

In-chat HTML mini-apps and games for WhatsApp (Baileys). Pairing site, plugin system, hot-reload.

## Quick start

```bash
npm install
# edit config.js — set ownerNumber / pairNumber (digits only, country code)
node index.js
```

Open `http://HOST:PORT/` for QR / pairing code.

### One-file host (KataBump / VPS)

```bash
node katabump.js
```

Edit the CONFIG block at the top of `katabump.js` (`phone`, `port`, `repoUrl`).
Auto-updates from GitHub every 5 minutes and restarts on new commits.

## Config

`config.js`:

- `ownerNumber` — full international digits (e.g. `923073477752`), used for `.send` / `.sendgame`
- `pairNumber` — same number used when requesting a pairing code
- `prefix` — command prefix (default `.`)
- `port` / `host`

Owner checks accept `fromMe`, phone JIDs, and common LID / alternate fields. If a command says owner-only, compare the id printed in the reply with `ownerNumber`.

## Commands

| Command | Action |
|---------|--------|
| `.menu` | Command list |
| `.phone` | Smartphone-style app launcher |
| `.apimenu` | Interactive online API tools |
| `.weather` `.pray` `.rate` `.define` | Live API commands |
| `.hub` | 90+ offline tools (categories) |
| `.utils` | Quick tools launcher |
| `.games` | Game list (HTML, button controls) |
| | `.id` | Print chat / sender ids |
| `.send <jid> <text>` | Owner: send text to a chat |
| `.sendgame <jid> <game>` | Owner: send a game to a chat |
| `.ping` | Latency |

Fun/tools: `.fact` `.joke` `.quote` `.coin` `.dice` `.choose a,b` `.password` `.time` …

## Plugins

Files in `plugins/` export `{ pattern, aliases, handler }` or an **array** of those.
Plugins are **hot-reloaded** when files change (no full process restart required for plugin edits).

## HTML mini-apps

Games and tools are self-contained HTML (no external network inside the card by default).
Controls use **on-screen buttons** so WhatsApp swipe gestures do not steal input.

## Development

```bash
node --check index.js
node --check plugins/*.js lib/*.js
npm test
```

GitHub Actions runs syntax checks on push.

## License

MIT
