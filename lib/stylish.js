const B = {
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
  n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
  N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
  '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',
};
function style(s){return String(s).split('').map(c=>B[c]||c).join('')}

function buildMenu({ botName, tagline, prefix, plugins }) {
  const p = prefix || '.';
  const by = {};
  for (const pl of plugins) (by[pl.category || 'general'] ||= []).push(pl);

  let out = '';
  out += `╔══ ${style(botName || 'MiniBot')} ══╗\n`;
  out += `║ ${String(tagline || 'Games · Utils · Tools').slice(0, 28)}\n`;
  out += `╚══════════════╝\n\n`;

  // Quick bar
  out += `✦ ${p}games  ${p}games2  ${p}utils\n`;
  out += `✦ ${p}id  ${p}send  ${p}ping\n\n`;

  const order = ['main', 'games', 'mini-apps', 'utilities', 'tools', 'general'];
  const icons = { main: '⚡', games: '🎮', 'mini-apps': '🧩', utilities: '🛠️', tools: '📤', general: '✨' };

  for (const cat of [...order.filter((c) => by[c]), ...Object.keys(by).filter((c) => !order.includes(c))]) {
    const list = by[cat];
    if (!list?.length) continue;
    out += `${icons[cat] || '•'} ${style(cat)}\n`;
    for (const pl of list) {
      const names = [pl.pattern, ...(pl.aliases || [])].filter(Boolean);
      if (names.length > 5) {
        out += `  ${p}${pl.pattern}  +${names.length - 1}\n`;
      } else {
        for (let i = 0; i < names.length; i += 2) {
          out += `  ${names.slice(i, i + 2).map((n) => p + n).join('  ')}\n`;
        }
      }
    }
    out += '\n';
  }
  out += `——————————\n`;
  out += `${p}id → chat id\n${p}send id text\n${p}sendgame id game`;
  return out.trim();
}

module.exports = { style, buildMenu };
