document.addEventListener('DOMContentLoaded', function () {

  // ── Chatbot ──
  const chatTrigger = document.getElementById('chatbot-trigger');
  const chatWindow  = document.getElementById('chatbot-window');  // ← renommé (évite écrasement de window)
  const chatClose   = document.getElementById('chatbot-close');
  const chatSend    = document.getElementById('chat-send');
  const chatInput   = document.getElementById('chat-input');
  const chatMsgs    = document.getElementById('chat-messages');

  if (chatTrigger && chatWindow) {
    chatTrigger.addEventListener('click', () => {
      chatWindow.style.display = 'flex';
      chatTrigger.style.display = 'none';
    });
  }
  if (chatClose && chatWindow) {
    chatClose.addEventListener('click', () => {
      chatWindow.style.display = 'none';
      chatTrigger.style.display = 'block';
    });
  }
  if (chatSend && chatInput && chatMsgs) {
    chatSend.addEventListener('click', sendChat);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendChat(); });
  }

  function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'background:var(--dark-blue);color:white;padding:10px;border-radius:10px;margin-bottom:10px;max-width:80%;margin-left:auto;';
    userMsg.textContent = text;
    chatMsgs.appendChild(userMsg);
    chatInput.value = '';
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.style.cssText = 'background:#f1f1f1;padding:10px;border-radius:10px;margin-bottom:10px;max-width:80%;';
      botMsg.textContent = 'Merci pour votre message ! Notre équipe vous répondra dans les plus brefs délais. Vous pouvez aussi nous appeler au +242 06 434 69 89.';
      chatMsgs.appendChild(botMsg);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }, 800);
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('[data-faq]').forEach(item => {
    item.addEventListener('click', function () {
      const answer = this.nextElementSibling;
      if (answer) answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
    });
  });

  // ── Active nav link highlighting (public pages) ──
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('nav a.nav-link').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

});

// ── Grade calculator (direction page) ──
function calculateGrade() {
  const dst     = parseFloat(document.getElementById('c-dst')?.value)     || 0;
  const tp      = parseFloat(document.getElementById('c-tp')?.value);
  const session = parseFloat(document.getElementById('c-session')?.value) || 0;
  let moy;
  if (!isNaN(tp) && tp > 0) {
    moy = dst * 0.30 + tp * 0.20 + session * 0.50;
  } else {
    moy = dst * 0.30 + session * 0.70;
  }
  const status = moy >= 10 ? '✓ Admis' : '✗ Ajourné';
  const color  = moy >= 10 ? 'green' : 'var(--red-itp)';
  const el = document.getElementById('calc-result');
  if (el) el.innerHTML = `Résultat : <span style="color:${color}">${moy.toFixed(2)} / 20 — ${status}</span>`;
}

// ── Room conflict checker (admin page) ──
function checkConflict() {
  const resultDiv = document.getElementById('conflict-result');
  const room = document.getElementById('room-select')?.value || '';
  if (!resultDiv) return;
  resultDiv.style.display = 'block';
  if (room.includes('204')) {
    resultDiv.style.cssText += 'background:#ffebee;color:#c62828;padding:12px;border-radius:5px;';
    resultDiv.textContent = '⚠️ CONFLIT DÉTECTÉ : La salle 204 est déjà occupée pour le cours de Développement Web à cet horaire.';
  } else {
    resultDiv.style.cssText += 'background:#e8f5e9;color:#2e7d32;padding:12px;border-radius:5px;';
    resultDiv.textContent = '✅ DISPONIBLE : La salle est libre pour cet horaire. Vous pouvez confirmer la réservation.';
  }
}
