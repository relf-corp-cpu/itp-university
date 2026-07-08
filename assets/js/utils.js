/**
 * ITP University — Utilitaires partagés
 * =====================================
 * Toast, Modal, PDF, Excel, QR Code, PWA, Sécurité, Notifications
 */

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
})();

function showToast(msg, type = 'info', duration = 3500) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, duration);
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const Modal = {
  show(title, bodyHTML, actions = []) {
    const existing = document.getElementById('itp-modal');
    if (existing) existing.remove();
    const btns = actions.map(a =>
      `<button class="${a.cls||'btn-primary'}" onclick="${a.fn}">${a.label}</button>`
    ).join(' ');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'itp-modal';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3 style="margin:0;">${title}</h3>
          <button class="modal-close" onclick="Modal.close()">&#x2715;</button>
        </div>
        <div>${bodyHTML}</div>
        ${btns ? `<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">${btns}</div>` : ''}
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) Modal.close(); });
    document.body.appendChild(overlay);
  },
  close() {
    const m = document.getElementById('itp-modal');
    if (m) m.remove();
  }
};
window.Modal = Modal;

// ─────────────────────────────────────────────────────────────────────────────
// TABS SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
function initTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
  const first = container.querySelector('.tab');
  if (first) first.click();
}
window.initTabs = initTabs;

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATOR (client-side via print)
// ─────────────────────────────────────────────────────────────────────────────
const PDF = {
  // Relevé de notes PDF
  generateTranscript(student, grades, year) {
    const rows = grades.map(g => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${g.course_name}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${g.dst_grade ?? '—'}/20</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${g.tp_grade ?? '—'}/20</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${g.session_grade ?? '—'}/20</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold;">${parseFloat(g.final_grade || 0).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;color:${g.status==='Admis'?'green':'red'}">${g.status || '—'}</td>
      </tr>`).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Relevé de Notes — ITP</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#333;}
      table{width:100%;border-collapse:collapse;margin-top:20px;}
      .header{text-align:center;border-bottom:3px solid #1D3557;padding-bottom:15px;margin-bottom:25px;}
      .logo-text{color:#1D3557;font-size:1.5rem;font-weight:bold;}
      .footer{margin-top:40px;display:flex;justify-content:space-between;}
      .sign-box{width:200px;border-top:1px solid #333;text-align:center;padding-top:5px;}
      @media print{button{display:none}}</style></head><body>
      <div class="header">
        <div class="logo-text">INSTITUT TECHNIQUE POLYTECHNIQUE (ITP)</div>
        <p>Brazzaville — République du Congo</p>
        <h2>RELEVÉ DE NOTES OFFICIEL</h2>
      </div>
      <p><strong>Étudiant :</strong> ${student.name || student.username || 'Jean Dupont'}</p>
      <p><strong>N° Matricule :</strong> ${student.student_id_card || 'ITP-2026-0452'}</p>
      <p><strong>Année Académique :</strong> ${year || '2025–2026'}</p>
      <table>
        <thead style="background:#1D3557;color:white;">
          <tr>
            <th style="padding:10px;border:1px solid #ddd;text-align:left;">Matière</th>
            <th style="padding:10px;border:1px solid #ddd;">DST(30%)</th>
            <th style="padding:10px;border:1px solid #ddd;">TP(20%)</th>
            <th style="padding:10px;border:1px solid #ddd;">Session</th>
            <th style="padding:10px;border:1px solid #ddd;">Moyenne</th>
            <th style="padding:10px;border:1px solid #ddd;">Statut</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <div class="sign-box">Signature du Directeur</div>
        <div class="sign-box">Cachet de l'ITP</div>
      </div>
      <p style="margin-top:20px;font-size:0.8rem;color:#666;">Document généré le ${new Date().toLocaleDateString('fr-FR')} — ITP Brazzaville</p>
      <button onclick="window.print()" style="margin-top:20px;padding:10px 25px;background:#1D3557;color:white;border:none;border-radius:5px;cursor:pointer;">Imprimer / Enregistrer PDF</button>
      </body></html>`);
    win.document.close();
  },

  // Reçu de paiement PDF
  generateReceipt(payment, student) {
    const win = window.open('', '_blank');
    const num = `REC-ITP-${Date.now().toString().slice(-6)}`;
    win.document.write(`<!DOCTYPE html><html><head><title>Reçu de Paiement — ITP</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:0 auto;}
      .receipt{border:2px solid #1D3557;padding:30px;border-radius:8px;}
      .header{text-align:center;margin-bottom:25px;border-bottom:2px solid #1D3557;padding-bottom:15px;}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;}
      .total{font-size:1.2rem;font-weight:bold;color:#1D3557;margin-top:15px;}
      @media print{button{display:none}}</style></head><body>
      <div class="receipt">
        <div class="header">
          <h2 style="color:#1D3557;margin:0;">ITP UNIVERSITY</h2>
          <p style="margin:5px 0;">Brazzaville — République du Congo</p>
          <h3>REÇU DE PAIEMENT</h3>
        </div>
        <p><strong>N° Reçu :</strong> ${num}</p>
        <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Étudiant :</strong> ${student?.name || 'Jean Dupont'}</p>
        <p><strong>N° Matricule :</strong> ${student?.student_id_card || 'ITP-2026-0452'}</p>
        <div style="margin-top:20px;">
          <div class="row"><span>Type de paiement</span><span>${payment.type || 'Scolarité'}</span></div>
          <div class="row"><span>Méthode</span><span>${payment.method || 'MTN Money'}</span></div>
          <div class="row total"><span>Montant payé</span><span>${parseInt(payment.amount||0).toLocaleString('fr-FR')} FCFA</span></div>
        </div>
        <p style="margin-top:25px;font-size:0.85rem;color:#666;text-align:center;">Ce reçu certifie que le paiement a été reçu par l'ITP.<br>
        Pour toute question : +242 06 434 69 89 | contact@itp-university.cg</p>
      </div>
      <button onclick="window.print()" style="margin-top:20px;padding:10px 25px;background:#1D3557;color:white;border:none;border-radius:5px;cursor:pointer;">Imprimer le reçu</button>
      </body></html>`);
    win.document.close();
  },

  // Bulletin complet
  generateBulletin(student, grades, year) {
    return this.generateTranscript(student, grades, year);
  }
};
window.PDF = PDF;

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL / CSV EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const Excel = {
  exportCSV(data, filename = 'export_itp.csv') {
    if (!data || !data.length) return showToast('Aucune donnée à exporter', 'warning');
    const headers = Object.keys(data[0]).join(',');
    const rows    = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const csv     = '\uFEFF' + headers + '\n' + rows; // BOM pour Excel FR
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    showToast('Export CSV téléchargé ✅', 'success');
  },

  exportGrades(grades, filename = 'notes_itp.csv') {
    const data = grades.map(g => ({
      Matière: g.course_name, 'DST(30%)': g.dst_grade ?? '',
      'TP(20%)': g.tp_grade ?? '', 'Session(70%)': g.session_grade ?? '',
      Moyenne: g.final_grade ?? '', Statut: g.status ?? ''
    }));
    this.exportCSV(data, filename);
  },

  exportPayments(payments, filename = 'paiements_itp.csv') {
    const data = payments.map(p => ({
      Date: p.payment_date ? new Date(p.payment_date).toLocaleDateString('fr-FR') : '',
      Type: p.type || '', Montant: p.amount || 0,
      Méthode: p.method || '', Statut: p.status || ''
    }));
    this.exportCSV(data, filename);
  },

  exportStudents(students, filename = 'etudiants_itp.csv') {
    const data = students.map(s => ({
      Matricule: s.student_id_card || '', Nom: s.last_name || '',
      Prénom: s.first_name || '', Email: s.email || '', Rôle: s.role || 'student'
    }));
    this.exportCSV(data, filename);
  }
};
window.Excel = Excel;

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE GENERATOR (API publique)
// ─────────────────────────────────────────────────────────────────────────────
function generateQR(data, size = 150) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=1D3557&bgcolor=FFFFFF`;
}
window.generateQR = generateQR;

// ─────────────────────────────────────────────────────────────────────────────
// SÉCURITÉ — Rate limiting côté client
// ─────────────────────────────────────────────────────────────────────────────
const Security = {
  // Compteur de tentatives de connexion
  loginAttempts: 0,
  maxAttempts: 5,
  lockoutUntil: null,

  checkLoginAllowed() {
    if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
      const secs = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
      showToast(`Trop de tentatives. Réessayez dans ${secs}s.`, 'error', 4000);
      return false;
    }
    return true;
  },

  recordFailedLogin() {
    this.loginAttempts++;
    if (this.loginAttempts >= this.maxAttempts) {
      this.lockoutUntil = Date.now() + 30000; // 30 secondes
      this.loginAttempts = 0;
      showToast('⛔ Compte temporairement bloqué (30s) — trop de tentatives.', 'error', 5000);
    }
  },

  resetLoginAttempts() { this.loginAttempts = 0; this.lockoutUntil = null; },

  // Validation des permissions
  requireRole(allowedRoles) {
    const user = window.ITP_API?.auth?.currentUser();
    if (!user) { window.location.href = '../auth/login.html'; return false; }
    if (!allowedRoles.includes(user.role)) {
      showToast('⛔ Accès non autorisé pour votre rôle.', 'error');
      setTimeout(() => history.back(), 2000);
      return false;
    }
    return true;
  },

  requireAuth() {
    const user = window.ITP_API?.auth?.currentUser();
    if (!user || !localStorage.getItem('itp_token')) {
      window.location.href = (window.location.pathname.includes('/pages/') || window.location.pathname === '/') ? './auth/login.html' : '../auth/login.html';
      return false;
    }
    return true;
  },

  // Journalisation locale des actions
  log(action, details = {}) {
    const logs = JSON.parse(localStorage.getItem('itp_action_logs') || '[]');
    logs.unshift({ action, details, user: this.currentUsername(), timestamp: new Date().toISOString() });
    localStorage.setItem('itp_action_logs', JSON.stringify(logs.slice(0, 100))); // max 100
    // Envoyer à l'API si disponible
    if (window.ITP_API?.auth?.isLoggedIn()) {
      fetch(`${window.ITP_CONFIG?.apiBase()}/activity_logs`, {
        method: 'POST',
        headers: window.ITP_CONFIG?.authHeaders() || { 'Content-Type':'application/json' },
        body: JSON.stringify({ action, details: JSON.stringify(details), ip_address: 'client' })
      }).catch(() => {});
    }
  },

  currentUsername() {
    const u = window.ITP_API?.auth?.currentUser();
    return u ? (u.username || u.name) : 'anonymous';
  },

  // Sanitize input (XSS protection)
  sanitize(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }
};
window.Security = Security;

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS PUSH (Web Push via Service Worker) + EMAIL + SMS
// ─────────────────────────────────────────────────────────────────────────────
const Notifs = {
  async requestPermission() {
    if (!('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  },

  push(title, body, icon = '/assets/images/icon-192.png') {
    if (Notification.permission === 'granted') {
      const n = new Notification(title, { body, icon });
      setTimeout(() => n.close(), 6000);
    } else {
      showToast(`🔔 ${title} — ${body}`, 'info', 5000);
    }
  },

  // Simule envoi email (en prod → Laravel Mailables ou Supabase Edge Functions)
  async sendEmail(to, subject, body) {
    console.log(`[ITP EMAIL] To: ${to} | Subject: ${subject}`);
    showToast(`📧 Email envoyé à ${to}`, 'success');
    return true;
  },

  // Simule envoi SMS MTN/Airtel Congo (+242)
  async sendSMS(phone, message) {
    const formatted = phone.startsWith('+242') ? phone : `+242${phone.replace(/\s/g,'')}`;
    console.log(`[ITP SMS] To: ${formatted} | Message: ${message}`);
    showToast(`📱 SMS envoyé au ${formatted}`, 'success');
    return true;
  },

  // Init — demander permission au chargement
  init() {
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => this.requestPermission(), 3000);
    }
  }
};
window.Notifs = Notifs;

// ─────────────────────────────────────────────────────────────────────────────
// PWA — Installation
// ─────────────────────────────────────────────────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('pwa-banner');
  if (banner) { banner.classList.add('show'); }
});

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') showToast('✅ ITP University installé sur votre appareil !', 'success');
      deferredPrompt = null;
      const banner = document.getElementById('pwa-banner');
      if (banner) banner.classList.remove('show');
    });
  }
}
function dismissPWA() {
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.classList.remove('show');
}
window.installPWA = installPWA;
window.dismissPWA = dismissPWA;

// ─────────────────────────────────────────────────────────────────────────────
// ASSISTANT IA — Chatbot intelligent
// ─────────────────────────────────────────────────────────────────────────────
const AI = {
  context: [],

  responses: {
    'inscription|inscri':        '📋 Pour vous inscrire, rendez-vous sur la page Pré-inscription. Vous aurez besoin de votre relevé de BAC et de votre pièce d\'identité. URL : /pages/pre-inscription.html',
    'frais|scolarité|paiement':  '💳 Les frais de scolarité sont de 450 000 FCFA/an pour la Licence et 650 000 FCFA pour le Master. Paiement possible en 3 tranches via MTN Money ou Airtel Money.',
    'note|résultat|moyenne':     '📊 Vos notes sont disponibles dans votre espace étudiant → Mes Notes. La formule est : Moyenne = DST×30% + Session×70%.',
    'emploi|cours|horaire':      '📅 Votre emploi du temps est disponible dans votre espace étudiant → Emploi du Temps. Il est mis à jour en temps réel depuis la base de données.',
    'stage|entreprise':          '💼 Les offres de stage sont disponibles dans la rubrique Stages. MTN, Airtel, SG Congo et d\'autres partenaires proposent des postes.',
    'bourse|aide':               '🎓 L\'ITP propose 3 types de bourses : Excellence (moyenne >16), Mérite (14-16), et Aide au Transport. Consultez la rubrique Bourses.',
    'contact|telephone|adresse': '📞 Contact ITP : +242 06 434 69 89 | 19, rue 5 février 1978, Poto-Poto, Brazzaville | contact@itp-university.cg',
    'biblioth|livre|emprunter':  '📚 La bibliothèque numérique contient plus de 100 ouvrages. Connectez-vous pour emprunter. Campus Poto-Poto : lundi-vendredi 8h-17h.',
    'carte|qr':                  '🪪 Votre carte étudiante numérique est disponible dans votre espace étudiant → Carte Numérique. Elle contient votre QR Code unique.',
    'supabase|api|base de données': '⚡ Ce site utilise Supabase (PostgreSQL) pour la démo GitHub Pages et Laravel + MySQL pour la version XAMPP locale. Config dans assets/js/config.js.',
    'default':                   '🤖 Je suis l\'assistant ITP Brazzaville. Je peux vous aider sur : les inscriptions, frais de scolarité, notes, emploi du temps, stages, bourses, bibliothèque. Reformulez votre question !'
  },

  reply(message) {
    const msg = message.toLowerCase();
    for (const [keywords, response] of Object.entries(this.responses)) {
      if (keywords === 'default') continue;
      if (keywords.split('|').some(kw => msg.includes(kw))) return response;
    }
    return this.responses.default;
  }
};
window.AI = AI;

// ─────────────────────────────────────────────────────────────────────────────
// CALCUL DES NOTES — Fonctions globales
// ─────────────────────────────────────────────────────────────────────────────
function calcNote(dst, session, tp = null) {
  if (tp !== null && !isNaN(tp) && tp > 0)
    return parseFloat((dst * 0.3 + tp * 0.2 + session * 0.5).toFixed(2));
  return parseFloat((dst * 0.3 + session * 0.7).toFixed(2));
}
window.calcNote = calcNote;

function noteStatus(moy) {
  if (moy >= 16) return { label:'Très Bien', color:'#1565c0' };
  if (moy >= 14) return { label:'Bien', color:'#2e7d32' };
  if (moy >= 12) return { label:'Assez Bien', color:'#388e3c' };
  if (moy >= 10) return { label:'Passable', color:'#f57c00' };
  if (moy >= 8)  return { label:'Compensable', color:'#e65100' };
  return              { label:'Ajourné', color:'#c62828' };
}
window.noteStatus = noteStatus;

// Init au chargement
document.addEventListener('DOMContentLoaded', () => {
  Notifs.init();
  // Mettre à jour le chat IA
  const sendBtn = document.getElementById('chat-send');
  if (sendBtn) {
    sendBtn.onclick = () => {
      const input = document.getElementById('chat-input');
      const msgs  = document.getElementById('chat-messages');
      const text  = input?.value?.trim();
      if (!text || !msgs) return;
      msgs.innerHTML += `<div class="user-message">${Security.sanitize(text)}</div>`;
      input.value = '';
      setTimeout(() => {
        const reply = AI.reply(text);
        msgs.innerHTML += `<div class="ai-message">${reply}</div>`;
        msgs.scrollTop = msgs.scrollHeight;
      }, 600);
      msgs.scrollTop = msgs.scrollHeight;
    };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : NOTIFICATIONS TEMPS RÉEL (SSE + Polling fallback)
// ─────────────────────────────────────────────────────────────────────────────
const Realtime = {
  _sse: null,
  _polling: null,
  _badge: null,
  _count: 0,

  init() {
    // Créer ou trouver le badge de notification dans le header
    this._badge = document.getElementById('notif-badge') || this._createBadge();
    this._loadCount();

    // Tenter SSE (Laravel) ou polling (Supabase / fallback)
    if (ITP_CONFIG.mode === 'laravel') {
      this._startSSE();
    } else {
      this._startPolling();
    }
  },

  _createBadge() {
    const badge = document.createElement('span');
    badge.id = 'notif-badge';
    badge.style.cssText = 'position:absolute;top:-5px;right:-5px;background:var(--red-itp);color:white;border-radius:50%;width:18px;height:18px;font-size:0.65rem;display:flex;align-items:center;justify-content:center;font-weight:bold;display:none;';
    const bellBtn = document.getElementById('notif-btn');
    if (bellBtn) { bellBtn.style.position='relative'; bellBtn.appendChild(badge); }
    return badge;
  },

  _loadCount() {
    const token = localStorage.getItem('itp_token');
    if (!token) return;
    fetch(`${ITP_CONFIG.apiBase()}/notifications`, { headers: ITP_CONFIG.authHeaders() })
      .then(r => r.json())
      .then(data => {
        const unread = data.unread ?? (data.notifications?.filter(n => !n.is_read).length ?? 0);
        this._updateBadge(unread);
      }).catch(() => {});
  },

  _startSSE() {
    const token = localStorage.getItem('itp_token');
    if (!token) return;
    try {
      this._sse = new EventSource(`${ITP_CONFIG.laravel.url.replace('/api/v1','')}/realtime/notifications?token=${token}`);
      this._sse.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'notification') {
            this._count++;
            this._updateBadge(this._count);
            this._showNotifToast(data.message, data.notif_type || 'info');
          }
        } catch {}
      };
      this._sse.onerror = () => {
        this._sse?.close();
        this._startPolling(); // Fallback
      };
    } catch {
      this._startPolling();
    }
  },

  _startPolling(interval = 30000) {
    // Polling toutes les 30 secondes
    this._polling = setInterval(() => this._loadCount(), interval);
  },

  _updateBadge(count) {
    this._count = count;
    if (!this._badge) return;
    if (count > 0) {
      this._badge.textContent = count > 99 ? '99+' : count;
      this._badge.style.display = 'flex';
    } else {
      this._badge.style.display = 'none';
    }
    // Mettre à jour le titre de la page
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = count > 0 ? `(${count}) ${base}` : base;
  },

  _showNotifToast(message, type = 'info') {
    if (typeof showToast === 'function') showToast(`🔔 ${message}`, type, 6000);
    // Notification navigateur
    if (Notification.permission === 'granted') {
      new Notification('ITP University', { body: message, icon: '/assets/images/icon-192.png' });
    }
  },

  markAllRead() {
    fetch(`${ITP_CONFIG.apiBase()}/notifications/read-all`, { method:'PATCH', headers: ITP_CONFIG.authHeaders() })
      .then(() => this._updateBadge(0))
      .catch(() => this._updateBadge(0));
  },

  stop() {
    this._sse?.close();
    if (this._polling) clearInterval(this._polling);
  }
};

// Auto-init si connecté
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('itp_token')) {
    setTimeout(() => Realtime.init(), 1000);
  }
});

window.Realtime = Realtime;
console.log('[ITP] Realtime module chargé — SSE + polling fallback');
