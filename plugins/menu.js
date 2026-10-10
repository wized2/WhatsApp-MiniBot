module.exports = {
  name: 'menu',
  pattern: 'menu',
  aliases: ['help', 'list', 'start', 'commands'],
  desc: 'Command menu',
  category: 'main',
  async handler({ reply }) {
    await reply(
`╭─ *ᴍɪɴɪʙᴏᴛ* ─╮
│ Phone · Tools · Games
╰────────────╯

📱 *.phone* / .mobile — smartphone home
🛠 *.utils* / .tools — everyday tools
🎮 *.snake* *.dino* *.ttt* *.2048*
   *.flappy* *.tetris* *.mines* *.hangman*
   *.games* — full game list

⚡ *.ping*  ·  🆔 *.id*
Owner: *.send*  *.sendgame*

_All apps open inside the chat_`
    );
  },
};
