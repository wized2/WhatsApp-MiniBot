/** Send-time store for Baileys getMessage (fixes "Waiting for this message") */
const byId = new Map();
const MAX = 2000;

function put(msg) {
  try {
    if (!msg?.message) return;
    const id = msg.key?.id;
    if (!id) return;
    const entry = { message: msg.message, key: msg.key };
    byId.set(id, entry);
    const jid = msg.key?.remoteJid;
    if (jid) {
      byId.set(`${jid}|${id}`, entry);
      byId.set(`${String(jid).split('@')[0]}|${id}`, entry);
      byId.set(`${String(jid).split(':')[0]}|${id}`, entry);
    }
    while (byId.size > MAX) {
      byId.delete(byId.keys().next().value);
    }
  } catch (_) {}
}

async function getMessage(key) {
  if (!key?.id) return undefined;
  let hit = byId.get(key.id);
  if (!hit && key.remoteJid) {
    hit =
      byId.get(`${key.remoteJid}|${key.id}`) ||
      byId.get(`${String(key.remoteJid).split('@')[0]}|${key.id}`) ||
      byId.get(`${String(key.remoteJid).split(':')[0]}|${key.id}`);
  }
  // NEVER return empty conversation — that burns the retry forever
  return hit?.message || undefined;
}

module.exports = { put, getMessage };
