const $ = (id) => document.getElementById(id);

async function refresh() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    $('botName').textContent = d.botName || 'MiniBot';
    if (!$('number').value && d.pairNumber) $('number').value = d.pairNumber;

    const dot = $('dot');
    const st = $('statusText');
    if (d.connected) {
      dot.className = 'dot ok';
      st.textContent = 'Connected' + (d.user?.id ? ' · ' + d.user.id : '');
    } else if (d.socketReady) {
      dot.className = 'dot wait';
      st.textContent = d.message || 'Ready to pair';
    } else if (d.lastError) {
      dot.className = 'dot bad';
      st.textContent = d.message || d.lastError;
    } else {
      dot.className = 'dot wait';
      st.textContent = d.message || 'Starting…';
    }

    const qr = $('qr');
    if (d.lastQrDataUrl && !d.connected) {
      qr.src = d.lastQrDataUrl;
      qr.hidden = false;
    } else {
      qr.hidden = true;
    }

    if (d.pairingCode && !d.connected) {
      $('codeBox').hidden = false;
      $('codeText').textContent = d.pairingCode;
    }

    $('btnCode').disabled = !!(d.connected || !d.socketReady);
  } catch (e) {
    $('statusText').textContent = 'Panel offline';
    $('dot').className = 'dot bad';
  }
}

$('btnCode').onclick = async () => {
  const number = $('number').value.replace(/\D/g, '');
  $('btnCode').disabled = true;
  $('statusText').textContent = 'Requesting real pairing code from WhatsApp…';
  try {
    const r = await fetch('/api/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'Failed');
    $('codeBox').hidden = false;
    $('codeText').textContent = d.code;
    $('statusText').textContent = d.hint || 'Enter the code in WhatsApp now';
    $('dot').className = 'dot wait';
  } catch (e) {
    alert(e.message || String(e));
  } finally {
    await refresh();
  }
};

$('btnCopy').onclick = async () => {
  const t = $('codeText').textContent.replace(/-/g, '');
  try {
    await navigator.clipboard.writeText(t);
    $('btnCopy').textContent = 'Copied';
    setTimeout(() => ($('btnCopy').textContent = 'Copy'), 1200);
  } catch {
    alert(t);
  }
};

refresh();
setInterval(refresh, 2000);
