module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Command menu',
  category: 'main',
  async handler({ reply }) {
    await reply(
`╭─ *ᴍɪɴɪʙᴏᴛ* ─╮
│ Phone · Tools · Games · Fun
╰──────────────╯

📱 *.phone* / .mobile
   Smartphone home · 40+ apps

🛠 *.utils* / .tools
⚡ *.ping*  ·  🆔 *.id*

🎮 Games
.snake .dino .ttt .2048 .flappy
.tetris .mines .hangman .games

🎉 Fun
.fact .joke .quote .coin .dice
.choose a,b .rate x .ship a,b
.love a,b .yesno .number 1 100
.mock text .reverse text .emoji
.wisdom .motivate .ascii hi

🧰 Quick tools
.password 16 .uuid .time
.count text .upper .lower .title
.binary .hash .palindrome

_All mini-apps open inside chat_`
    );
  },
};
