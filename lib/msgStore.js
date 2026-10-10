/** In-memory store so Baileys can answer retry requests (fixes "Waiting for this message") */
const byId = new Map();
const MAX = 800;

function put(msg) {
  try {
    const id = msg?.key?.id;
    if (!id || !msg.message) return;
    const entry = { message: msg.message, key: msg.key };
    byId.set(id, entry);
    const jid = msg.key.remoteJid;
    if (jid) byId.set(jid + '|' + id, entry);
    while (byId.size > MAX) {
      const first = byId.keys().next().value;
      byId.delete(first);
    }
  } catch (_) {}
}

async function getMessage(key) {
  if (!key?.id) return undefined;
  const hit =
    byId.get(key.id) ||
    (key.remoteJid ? byId.get(key.remoteJid + '|' + key.id) : null);
  // Must return undefined on miss — empty conversation burns retries
  return hit?.message || undefined;
}

module.exports = { put, getMessage };
