# WhatsApp MiniBot

Node.js WhatsApp bot with:

- **Pairing website** (QR + pairing code)
- **Plugin system** (`plugins/`)
- **Games** (guess number, tic-tac-toe)
- **Mini-apps** (quiz, canvas HTML demo)

Built on [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).

## Quick start

```bash
git clone https://github.com/wized2/WhatsApp-MiniBot.git
cd WhatsApp-MiniBot
npm install
```

Edit `config.js`:

```js
botName: 'MiniBot',
ownerNumber: '923001234567',
pairNumber: '923001234567',
port: 3000,
prefix: '.',
```

Run:

```bash
npm start
```

Open the pairing site:

```
http://127.0.0.1:3000
```

1. Scan the **QR**, or  
2. Enter your number → **Get code** → in WhatsApp: *Linked devices → Link with phone number*

## Commands

| Command | Description |
|---------|-------------|
| `.menu` | All commands |
| `.ping` | Latency |
| `.guess start` | Number game 1–50 |
| `.ttt start` | Tic-tac-toe vs bot |
| `.quiz js` / `.quiz wa` | Quiz mini-app |
| `.miniapp` | Canvas mini-app card + HTML demo |

## Project layout

```
config.js          # name, port, numbers, prefix
index.js           # bot + session
lib/
  pluginLoader.js
  pairServer.js    # Express pairing API + static site
plugins/           # drop-in commands
public/            # pairing UI
session/           # auth (gitignored)
```

## Add a plugin

Create `plugins/hello.js`:

```js
module.exports = {
  name: 'hello',
  pattern: 'hello',
  aliases: ['hi'],
  desc: 'Say hi',
  category: 'main',
  async handler({ reply, arg }) {
    await reply(`Hello ${arg || 'there'}!`);
  },
};
```

Restart the bot (plugins load on startup).

## In-chat HTML mini-apps

Stock Baileys delivers **text / media / buttons**.  
**True HTML canvas inside the bubble** needs a Baileys fork with embedded WebUI / rich HTML primitives (see `plugins/miniapp-canvas.js`). That plugin always sends a usable card, and will call `sock.sendInlineWebUI` when the fork provides it.

## License

MIT


## Pairing troubleshooting

**Dead / rejected codes (no WhatsApp notification)** usually mean:

1. Custom `browser` label — fixed to `Browsers.macOS('Chrome')` (required for pairing IQ).
2. Code requested before handshake — wait until the site says **Ready**, then **Get code**.
3. Stale `session/` — delete it and restart: `rm -rf session && npm start`.
4. Wrong number format — digits only with country code, e.g. `923001234567` (no `+`).
5. Code expired — enter within about **1 minute** after it appears.

On phone: **WhatsApp → Linked devices → Link a device → Link with phone number instead**.

## KataBump (one file)

Upload / set start command to:

```bash
node katabump.js
```

Env:
- `PORT=20299` (default in script)
- `REPO_URL` (default this repo)
- `BRANCH=main`

The script `git pull`s latest code, `npm install`s, keeps `session/` persistent, and starts the bot on `0.0.0.0:$PORT`.

## Games

`.games` lists them. Examples: `.snake` `.tetris` `.pong` `.flappy` `.2048` `.memory` `.mines` `.simon` `.ttt` `.dino` …

## HTML mini-apps (important)

In-chat HTML uses WhatsApp’s **GenAI rich response** format (`baileys@7`).

- Works best on **WhatsApp Android** (latest).
- iOS / Web may show only a title or not render the WebView.
- Requires `getMessage` store (included) so peers don’t stick on *“Waiting for this message”*.
- After upgrading, do a clean `npm install`. If pairing breaks, delete `session/` and pair again.

## In-chat HTML (Business + stock Android)

Mini-apps use WhatsApp's internal `GenAIaeacdsnwHtmlPrimitive` (Android WebView).

**What research shows:**
- Works as in-chat card on many **WhatsApp Business** Android builds
- **Stock WhatsApp** often shows *Waiting for this message* until the card is re-rendered
- Proven fix used by elaina-baileys / @yudzxml: after `relayMessage`, send **protocolMessage type 14 (MESSAGE_EDIT)** with the same body (`bypassDownload`)
- `getMessage` must return the **full** original message on retry (never `{}`)

MiniBot implements both. Still Android-focused; iOS/Web may only show the title label.

Env: `HTML_BYPASS_DOWNLOAD=0` disables the edit follow-up.
