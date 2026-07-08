/**
 * ITP University — Garde d'authentification et de rôle (client-side)
 * ====================================================================
 * Ajouter en haut de chaque page protégée :
 *   <script src="../assets/js/auth-guard.js" data-role="student"></script>
 * Ou plusieurs rôles :
 *   <script src="../assets/js/auth-guard.js" data-role="admin,secretary"></script>
 */

(function () {
  // Attendre que le DOM soit chargé
  function guard() {
    const script      = document.currentScript ||
                        document.querySelector('script[data-role]');
    const requiredStr = script ? script.getAttribute('data-role') : null;
    const token       = localStorage.getItem('itp_token');
    const userStr     = localStorage.getItem('itp_user');

    // 1. Non connecté → redirection login
    if (!token || !userStr) {
      const depth  = window.location.pathname.split('/').filter(Boolean).length;
      const prefix = '../'.repeat(Math.max(0, depth - 1));
      window.location.replace(`${prefix}auth/login.html?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }

    // 2. Token expiré simulé (si "demo_token" et > 8h)
    if (token === 'demo_token') {
      const loginTime = parseInt(localStorage.getItem('itp_login_time') || '0');
      const elapsed   = Date.now() - loginTime;
      if (loginTime && elapsed > 8 * 60 * 60 * 1000) {
        localStorage.removeItem('itp_token');
        localStorage.removeItem('itp_user');
        const depth  = window.location.pathname.split('/').filter(Boolean).length;
        const prefix = '../'.repeat(Math.max(0, depth - 1));
        window.location.replace(`${prefix}auth/login.html?session=expired`);
        return;
      }
    }

    // 3. Vérification du rôle
    let user;
    try { user = JSON.parse(userStr); } catch { user = {}; }

    if (requiredStr) {
      const allowed = requiredStr.split(',').map(r => r.trim());
      if (!allowed.includes(user.role)) {
        // Rediriger vers le bon dashboard selon le rôle réel
        const DASHBOARDS = {
          admin:     '../admin/index.html',
          professor: '../professor/index.html',
          student:   '../student/index.html',
          secretary: '../secretary/index.html',
          direction: '../direction/index.html',
        };
        const dest = DASHBOARDS[user.role] || '../auth/login.html';
        // Afficher un message avant redirection
        document.body.innerHTML = `
          <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f9fa;font-family:Arial,sans-serif;">
            <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
              <i class="fas fa-shield-alt" style="font-size:3rem;color:#e63946;margin-bottom:20px;display:block;"></i>
              <h2 style="color:#1D3557;margin:0 0 10px;">Accès non autorisé</h2>
              <p style="color:#666;">Votre rôle (<strong>${user.role}</strong>) ne permet pas d'accéder à cette section.</p>
              <p style="color:#999;font-size:0.85rem;">Redirection dans <span id="countdown">3</span>s...</p>
            </div>
          </div>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">`;
        let c = 3;
        const interval = setInterval(() => {
          c--;
          const el = document.getElementById('countdown');
          if (el) el.textContent = c;
          if (c <= 0) { clearInterval(interval); window.location.replace(dest); }
        }, 1000);
        return;
      }
    }

    // 4. Injecter le nom d'utilisateur dans la page si possible
    document.addEventListener('DOMContentLoaded', () => {
      const greetEl = document.getElementById('prof-greeting') ||
                      document.getElementById('greeting') ||
                      document.getElementById('profil-name');
      if (greetEl && user.name) {
        greetEl.textContent = `Bonjour, ${user.name}`;
      }
      // Badge rôle
      const roleEl = document.getElementById('profil-role');
      if (roleEl && user.role) roleEl.textContent = user.role;
      // Log d'accès
      if (window.Security) Security.log('page_access', { page: window.location.pathname, role: user.role });
    });

    // 5. Enregistrer le temps de connexion si absent
    if (!localStorage.getItem('itp_login_time')) {
      localStorage.setItem('itp_login_time', Date.now().toString());
    }
  }

  guard();
})();
