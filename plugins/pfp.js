module.exports = {
  name: 'pfp',
  pattern: 'pfp',
  aliases: ['dp', 'profilepic'],
  desc: 'Get profile picture by phone number',
  category: 'tools',
  async handler({ sock, args, m, reply, prefix }) {
    const p = prefix || '.';
    let num = String(args.join('') || '').replace(/\D/g, '');
    const ctxInfo = m.message?.extendedTextMessage?.contextInfo;
    let jid = null;
    if (num) jid = num + '@s.whatsapp.net';
    else if (ctxInfo?.mentionedJid?.[0]) jid = ctxInfo.mentionedJid[0];
    else if (ctxInfo?.participant) jid = ctxInfo.participant;
    if (!jid) return reply(`*Usage:* ${p}pfp <number with country code>\nExample: ${p}pfp 923001234567\nOr reply to / mention someone.`);
    if (num) {
      try {
        const r = await sock.onWhatsApp(jid);
        if (!r || !r[0] || !r[0].exists) return reply('That number is not on WhatsApp.');
        jid = r[0].jid;
      } catch (_) {}
    }
    let url = null;
    try { url = await sock.profilePictureUrl(jid, 'image'); } catch (_) {}
    if (!url) return reply('No profile picture (none set, or hidden by privacy).');
    try {
      await reply({ image: { url }, caption: `*Profile picture*\n+${jid.split('@')[0].split(':')[0]}` });
    } catch (e) {
      await reply('Could not send the picture: ' + (e.message || e));
    }
  },
};
