const DEFAULT_UA = 'Mozilla/5.0 (compatible; MiniBot/1.8; +https://github.com/wized2/WhatsApp-MiniBot)';

async function getJson(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent': opts.ua || DEFAULT_UA,
        ...(opts.headers || {}),
      },
      redirect: 'follow',
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error('HTTP ' + res.status);
      err.status = res.status;
      err.body = text.slice(0, 200);
      throw err;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } finally {
    clearTimeout(t);
  }
}

async function getText(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': opts.ua || DEFAULT_UA, ...(opts.headers || {}) },
      redirect: 'follow',
    });
    const text = await res.text();
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return text;
  } finally {
    clearTimeout(t);
  }
}

module.exports = { getJson, getText };
