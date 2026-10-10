const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const roots = ['index.js', 'config.js', 'katabump.js', 'lib', 'plugins', 'scripts'];
const files = [];

function walk(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const f of fs.readdirSync(p)) {
      if (f === 'node_modules' || f.startsWith('.')) continue;
      walk(path.join(p, f));
    }
  } else if (p.endsWith('.js')) files.push(p);
}

for (const r of roots) {
  if (fs.existsSync(r)) walk(r);
}

let failed = 0;
for (const f of files) {
  try {
    execSync(`node --check "${f}"`, { stdio: 'pipe' });
    console.log('OK', f);
  } catch (e) {
    failed += 1;
    console.error('FAIL', f);
    console.error(e.stderr ? e.stderr.toString() : e.message);
  }
}

// load plugins
try {
  const { loadPlugins } = require('../lib/pluginLoader');
  const plugs = loadPlugins(path.join(__dirname, '..', 'plugins'));
  console.log('plugins loaded', plugs.length);
  if (plugs.length < 5) throw new Error('too few plugins');
} catch (e) {
  failed += 1;
  console.error('plugin load failed', e.message);
}

// owner helper unit smoke
try {
  const { isOwner } = require('../lib/owner');
  const ok = isOwner({
    m: { key: { fromMe: true, remoteJid: 'x@s.whatsapp.net' } },
    jid: 'x@s.whatsapp.net',
    sender: 'x@s.whatsapp.net',
    sock: { user: { id: '923073477752:1@s.whatsapp.net' } },
    config: { ownerNumber: '923073477752' },
  });
  if (!ok) throw new Error('fromMe should be owner');
  const ok2 = isOwner({
    m: { key: { fromMe: false, remoteJid: '923073477752@s.whatsapp.net', participant: '923073477752@s.whatsapp.net' } },
    jid: '923073477752@s.whatsapp.net',
    sender: '923073477752@s.whatsapp.net',
    sock: { user: { id: '923073477752:1@s.whatsapp.net' } },
    config: { ownerNumber: '923073477752' },
  });
  if (!ok2) throw new Error('participant phone should be owner');
  console.log('owner checks OK');
} catch (e) {
  failed += 1;
  console.error('owner test failed', e.message);
}

if (failed) {
  console.error('FAILED', failed);
  process.exit(1);
}
console.log('ALL TESTS PASSED');
