/** Auto-generate compact Unicode-styled menu */

const BOLD = {
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
  n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
  N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
  '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',
};

function style(str) {
  return String(str).split('').map((ch) => BOLD[ch] || ch).join('');
}

function buildMenu({ botName, tagline, prefix, plugins }) {
  const by = {};
  for (const p of plugins) {
    const c = p.category || 'general';
    (by[c] ||= []).push(p);
  }
  const order = ['main', 'games', 'mini-apps', 'utilities', 'tools', 'general'];
  const cats = [...order.filter((c) => by[c]), ...Object.keys(by).filter((c) => !order.includes(c)).sort()];
  const icons = { main: '⚡', games: '🎮', 'mini-apps': '🧩', utilities: '🛠️', tools: '📤', general: '✨' };

  let out = `┏ ${style(botName || 'MiniBot')}\n`;
  if (tagline) out += `┃ ${String(tagline).slice(0, 36)}\n`;
  out += `┃ ${prefix}menu · ${prefix}games · ${prefix}utils\n`;
  out += `┗━━━━━━━━━━━━\n`;

  for (const cat of cats) {
    const list = by[cat];
    if (!list?.length) continue;
    out += `\n${icons[cat] || '•'} ${style(cat)}\n`;

    for (const p of list) {
      let names = [p.pattern, ...(p.aliases || [])].filter(Boolean);
      // For big packs, show pattern + count only
      if (names.length > 6) {
        const extra = names.length - 1;
        out += ` ${prefix}${p.pattern} +${extra}\n`;
        if (p.desc) out += `  ${String(p.desc).slice(0, 40)}\n`;
      } else {
        // short lines — max ~2 names per line
        for (let i = 0; i < names.length; i += 2) {
          const chunk = names.slice(i, i + 2).map((n) => prefix + n).join(' · ');
          out += ` ${chunk}\n`;
        }
      }
    }
  }
  out += `\n• ${prefix}id — chat id\n• ${prefix}send id text\n• ${prefix}sendgame id name`;
  return out;
}

module.exports = { style, buildMenu };
