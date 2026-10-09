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
