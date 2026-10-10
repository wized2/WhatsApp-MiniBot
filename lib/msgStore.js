/** Send-time message store for Baileys getMessage retries */
const byId = new Map();
const MAX = 1200;

function put(msg) {
  try {
    if (!msg?.message) return;
    const id = msg.key?.id;
    if (!id) return;
    const entry = { message: msg.message, key: msg.key };
    byId.set(id, entry);
    const jid = msg.key?.remoteJid;
    if (jid) {
      byId.set(jid + '|' + id, entry);
      const bare = String(jid).split(':')[0];
      if (bare !== jid) byId.set(bare + '|' + id, entry);
    }
    while (byId.size > MAX) byId.delete(byId.keys().next().value);
  } catch (_) {}
}

async function getMessage(key) {
  if (!key?.id) return undefined;
  let hit = byId.get(key.id);
  if (!hit && key.remoteJid) {
    hit = byId.get(key.remoteJid + '|' + key.id);
    if (!hit) hit = byId.get(String(key.remoteJid).split(':')[0] + '|' + key.id);
  }
  // IMPORTANT: return undefined on miss — never empty conversation
  return hit?.message || undefined;
}

module.exports = { put, getMessage };
