/** Auto-generate sleek Unicode-styled menu text */

const MAPS = {
  bold: {
    a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
    n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
    A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
    N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
    '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',
  },
  sans: {
    a:'𝖺',b:'𝖻',c:'𝖼',d:'𝖽',e:'𝖾',f:'𝖿',g:'𝗀',h:'𝗁',i:'𝗂',j:'𝗃',k:'𝗄',l:'𝗅',m:'𝗆',
    n:'𝗇',o:'𝗈',p:'𝗉',q:'𝗊',r:'𝗋',s:'𝗌',t:'𝗍',u:'𝗎',v:'𝗏',w:'𝗐',x:'𝗑',y:'𝗒',z:'𝗓',
    A:'𝖠',B:'𝖡',C:'𝖢',D:'𝖣',E:'𝖤',F:'𝖥',G:'𝖦',H:'𝖧',I:'𝖨',J:'𝖩',K:'𝖪',L:'𝖫',M:'𝖬',
    N:'𝖭',O:'𝖮',P:'𝖯',Q:'𝖰',R:'𝖱',S:'𝖲',T:'𝖳',U:'𝖴',V:'𝖵',W:'𝖶',X:'𝖷',Y:'𝖸',Z:'𝖹',
  },
};

function style(str, map = 'bold') {
  const m = MAPS[map] || MAPS.bold;
  return String(str).split('').map((ch) => m[ch] || ch).join('');
}

function line(width = 22) {
  return '─'.repeat(width);
}

function section(title, icon = '✦') {
  return `${icon}  ${style(title.toUpperCase())}`;
}

/**
 * Build a sleek menu from plugins list.
 * @param {object} opts
 */
function buildMenu({ botName, tagline, prefix, plugins }) {
  const by = {};
  for (const p of plugins) {
    const c = p.category || 'general';
    (by[c] ||= []).push(p);
  }

  const order = ['main', 'games', 'mini-apps', 'utilities', 'general'];
  const cats = [
    ...order.filter((c) => by[c]),
    ...Object.keys(by).filter((c) => !order.includes(c)).sort(),
  ];

  const iconFor = {
    main: '⚡',
    games: '🎮',
    'mini-apps': '🧩',
    utilities: '🛠️',
    general: '✨',
  };

  let out = '';
  out += `╭───━━━ ${style(botName || 'MiniBot')} ━━━───╮\n`;
  if (tagline) out += `│  ${tagline}\n`;
  out += `│  ${style('prefix')}  \`${prefix}\`\n`;
  out += `╰${line(28)}╯\n`;

  for (const cat of cats) {
    const list = by[cat];
    if (!list?.length) continue;
    out += `\n${section(cat, iconFor[cat] || '•')}\n`;
    out += `${line(26)}\n`;

    for (const p of list) {
      let names = [p.pattern, ...(p.aliases || [])].filter(Boolean);
      // collapse huge alias lists
      if (p.file === 'games-pack.js' || names.length > 8) {
        names = [p.pattern, ...(p.aliases || []).slice(0, 6)];
        const more = (p.aliases || []).length > 6 ? ` +${(p.aliases || []).length - 6}` : '';
        const cmd = names.map((n) => `${prefix}${n}`).join(' · ');
        out += `  ▸ ${cmd}${more}\n`;
        if (p.desc) out += `     └ ${p.desc}\n`;
      } else {
        const cmd = names.map((n) => `${prefix}${n}`).join(' · ');
        out += `  ▸ ${cmd}\n`;
        if (p.desc) out += `     └ ${p.desc}\n`;
      }
    }
  }

  out += `\n╭${line(28)}╮\n`;
  out += `│  ${style('Tip')}: type ${prefix}games for full game list\n`;
  out += `│  ${style('Public')} — anyone can use commands\n`;
  out += `╰${line(28)}╯`;
  return out;
}

module.exports = { style, buildMenu, section, line };
