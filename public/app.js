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
      st.textContent = `Connected${d.user?.id ? ' · ' + d.user.id : ''}`;
    } else if (d.pairingCode || d.lastQrDataUrl) {
      dot.className = 'dot wait';
      st.textContent = d.message || 'Waiting for link…';
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
  } catch (e) {
    $('statusText').textContent = 'Panel offline';
    $('dot').className = 'dot bad';
  }
}

$('btnCode').onclick = async () => {
  const number = $('number').value.replace(/\D/g, '');
  $('btnCode').disabled = true;
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
  } catch (e) {
    alert(e.message || String(e));
  } finally {
    $('btnCode').disabled = false;
  }
};

$('btnCopy').onclick = async () => {
  const t = $('codeText').textContent;
  try {
    await navigator.clipboard.writeText(t.replace(/-/g, ''));
    $('btnCopy').textContent = 'Copied';
    setTimeout(() => ($('btnCopy').textContent = 'Copy'), 1200);
  } catch {
    alert(t);
  }
};

refresh();
setInterval(refresh, 2500);
