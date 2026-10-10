const byId = new Map();
const MAX = 1000;

function put(msg) {
  try {
    if (!msg?.message) return;
    const id = msg.key?.id;
    if (!id) return;
    const entry = { message: msg.message, key: msg.key };
    byId.set(id, entry);
    const jid = msg.key.remoteJid;
    if (jid) byId.set(`${jid}|${id}`, entry);
    // Also index without device suffix
    if (jid && jid.includes(':')) {
      byId.set(`${jid.split(':')[0]}|${id}`, entry);
    }
    while (byId.size > MAX) byId.delete(byId.keys().next().value);
  } catch (_) {}
}

async function getMessage(key) {
  if (!key?.id) return undefined;
  let hit = byId.get(key.id);
  if (!hit && key.remoteJid) {
    hit = byId.get(`${key.remoteJid}|${key.id}`);
  }
  if (!hit && key.remoteJid) {
    const base = String(key.remoteJid).split(':')[0];
    hit = byId.get(`${base}|${key.id}`);
  }
  return hit?.message || undefined;
}

module.exports = { put, getMessage };
