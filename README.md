# WhatsApp MiniBot

Self-hosted WhatsApp multi-device bot with **in-chat mini-apps**, games, offline tools, and live API commands.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)

## Features

- Pairing-code login (web UI on `PORT`)
- Plugin system with hot-reload
- **Phone** launcher (`.phone`) — dialer, messages, camera, gallery, maps, …
- **Hub** offline toolkit (`.hub`) — 90+ tools
- **Games** (`.games`) — 70+ button mini-games
- **Live APIs** (`.api`, `.weather`, `.pray`, `.define`, …)
- Native interactive **lists / quick-reply** menus when the client supports them
- Anti-spam rate limits and send jitter

## Quick start

```bash
git clone https://github.com/wized2/WhatsApp-MiniBot.git
cd WhatsApp-MiniBot
npm install
# edit config.js — ownerNumber / pairNumber
npm start
```

Open `http://localhost:3000`, request a pairing code, enter it in WhatsApp → Linked devices.

### KataBump one-file runner

```bash
node katabump.js
```

Config block is at the top of `katabump.js` (phone, port, auto-update interval).

## Commands (common)

| Command | Description |
|---------|-------------|
| `.menu` | Command overview |
| `.phone` | Smartphone-style launcher |
| `.hub` | Offline multi-tool hub |
| `.utils` | Quick tools |
| `.games` | Game list |
| `.api` | Interactive API menu |
| `.fun` | Fun API menu |
| `.weather <city>` | Live weather |
| `.pray <city>` | Prayer times |
| `.rate USD PKR` | Exchange rate |
| `.define <word>` | Dictionary |
| `.tr en\|ur text` | Translate |
| `.github user` / `user/repo` | GitHub info |
| `.id` | Chat / group id |
| `.send` / `.sendgame` | Owner relay |

Prefix defaults to `.` (`config.prefix`).

## Project layout

```
index.js          # socket + message router
config.js         # bot settings
katabump.js       # single-file deploy helper
lib/              # transport, anti-ban, interactive, games
plugins/          # commands (hot-reloaded)
public/           # pairing site assets
scripts/          # tests
```

## Configuration

Edit `config.js`:

| Key | Purpose |
|-----|---------|
| `ownerNumber` | Owner digits (country code, no +) |
| `pairNumber` | Number used for pairing API |
| `prefix` | Command prefix |
| `port` | Pairing web UI port |

Environment: `PORT`, `PUBLIC_URL`, `RICH_BOT_JID`, `HTML_BYPASS_DOWNLOAD`.

## Development

```bash
npm test          # syntax + plugin load checks
npm start
```

Add a plugin under `plugins/` exporting `{ pattern, handler }` or an array of commands.

## Security & anti-ban

- Per-chat command rate limit
- Queued outbound messages with random delay
- API cooldown keys
- Group replies truncated when very long

Unofficial clients can still risk account restrictions. Use a secondary number for experiments.

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
