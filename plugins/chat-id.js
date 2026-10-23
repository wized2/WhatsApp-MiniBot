module.exports = {
  name: 'id',
  pattern: 'id',
  aliases: ['jid', 'gid', 'chatid'],
  desc: 'Show this chat unique id',
  category: 'tools',
  async handler({ jid, m, reply }) {
    const isGroup = jid.endsWith('@g.us');
    const isChannel = jid.endsWith('@newsletter');
    const sender = m.key.participant || m.participant || '';
    let text = `*Chat ID*\n\`${jid}\`\n`;
    text += `Type: ${isChannel ? 'Channel' : isGroup ? 'Group' : 'DM'}\n`;
    if (sender) text += `You: \`${sender}\`\n`;
    text += `\nSend here from elsewhere:\n.send ${jid} hello`;
    await reply(text);
  },
};
