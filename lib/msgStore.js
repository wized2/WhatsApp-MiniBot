/** Tiny in-memory store so Baileys can answer retry requests */
const store = new Map(); // id -> { message, key }
const MAX = 500;

function put(msg) {
  try {
    const id = msg?.key?.id;
    if (!id || !msg.message) return;
    store.set(id, { message: msg.message, key: msg.key });
    if (store.size > MAX) {
      const first = store.keys().next().value;
      store.delete(first);
    }
  } catch (_) {}
}

async function getMessage(key) {
  if (!key?.id) return undefined;
  const hit = store.get(key.id);
  // Must return undefined (not empty conversation) on miss — empty burns retries
  return hit?.message || undefined;
}

module.exports = { put, getMessage };
