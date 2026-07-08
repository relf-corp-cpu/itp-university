/**
 * ITP University — Composants partagés
 * Header et footer injectés dynamiquement + gestion auth
 */
(function () {
  const path     = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const knownFolders = ['pages','auth','student','professor','admin','secretary','direction'];
  const inSub    = knownFolders.some(f => segments.includes(f));
  const root     = inSub ? '../' : './';

  const user     = (() => { try { return JSON.parse(localStorage.getItem('itp_user') || 'null'); } catch { return null; } })();
  const isLogged = !!localStorage.getItem('itp_token');

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  const navLinks = [
    { href:'index.html',               label:'Accueil' },
    { href:'pages/formations.html',    label:'Formations' },
    { href:'pages/filieres.html',      label:'Filières' },
    { href:'pages/admissions.html',    label:'Admissions' },
    { href:'pages/evenements.html',    label:'Événements' },
    { href:'pages/actualites.html',    label:'Actualités' },
    { href:'pages/bibliotheque.html',  label:'Bibliothèque' },
    { href:'pages/calendrier.html',    label:'Calendrier' },
    { href:'pages/forum.html',         label:'Forum' },
    { href:'pages/stages.html',        label:'Stages' },
    { href:'pages/bourses.html',       label:'Bourses' },
    { href:'pages/contact.html',       label:'Contact' },
    { href:'pages/examens.html',       label:'Examens' },
    { href:'pages/recherche.html',     label:'Recherche' },
    { href:'pages/annonces.html',      label:'Annonces' },
    { href:'pages/memoires.html',      label:'Mémoires' },
    { href:'pages/scanner.html',       label:'📷 Scanner QR' },
  ];

  const navHtml = navLinks.map(l =>
    `<a href="${root}${l.href}" class="nav-link">${l.label}</a>`
  ).join('\n');

  // Boutons auth dynamiques
  const authButtons = isLogged
    ? `<div style="display:flex;align-items:center;gap:10px;">
         <a href="${root}${getRoleDestination(user?.role)}" class="btn-primary" style="font-size:0.85rem;">Mon espace</a>
         <button onclick="logoutUser()" class="btn-outline" style="font-size:0.85rem;">Déconnexion</button>
       </div>`
    : `<div style="display:flex;gap:8px;">
         <a href="${root}auth/login.html" class="btn-primary" style="font-size:0.85rem;">Connexion</a>
         <a href="${root}auth/register.html" class="btn-outline" style="font-size:0.85rem;">Inscription</a>
       </div>`;

  function getRoleDestination(role) {
    const map = { admin:'admin/index.html', professor:'professor/index.html', student:'student/index.html', secretary:'secretary/index.html', direction:'direction/index.html' };
    return map[role] || 'auth/login.html';
  }

  const header = `
<nav style="display:flex;justify-content:space-between;align-items:center;padding:10px 30px;border-bottom:1px solid var(--light-grey);flex-wrap:wrap;gap:8px;background:white;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div class="logo">
    <a href="${root}index.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
      <img src="${root}assets/images/icon-192.png" alt="ITP" style="width:38px;height:38px;">
      <span style="font-weight:bold;color:var(--dark-blue);font-size:0.95rem;">ITP University</span>
    </a>
  </div>
  <div class="menu" style="display:flex;flex-wrap:wrap;gap:3px;">
    ${navHtml}
  </div>
  <button class="mobile-menu-toggle" onclick="toggleMobileMenu()" aria-label="Menu" aria-expanded="false">
    <i class="fas fa-bars"></i>
  </button>
  ${authButtons}
</nav>
<div id="mobile-menu" style="display:none;background:white;border-bottom:1px solid var(--light-grey);padding:15px;">
  ${navLinks.map(l => `<a href="${root}${l.href}" style="display:block;padding:10px 0;color:var(--dark-blue);text-decoration:none;border-bottom:1px solid #f0f0f0;">${l.label}</a>`).join('')}
</div>`;

  const footer = `
<footer style="background-color:var(--dark-blue);color:var(--white);padding:50px;margin-top:50px;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:1200px;margin:0 auto;">
    <div>
      <h3 style="color:white;">ITP University</h3>
      <p style="opacity:0.85;">Institut d'excellence dédié à la formation des leaders technologiques de demain à Brazzaville.</p>
    </div>
    <div>
      <h3 style="color:white;">Navigation</h3>
      <ul style="list-style:none;padding:0;line-height:2;">
        <li><a href="${root}pages/a-propos.html" style="color:rgba(255,255,255,0.8);text-decoration:none;">À propos</a></li>
        <li><a href="${root}pages/evenements.html" style="color:rgba(255,255,255,0.8);text-decoration:none;">Événements</a></li>
        <li><a href="${root}pages/calendrier.html" style="color:rgba(255,255,255,0.8);text-decoration:none;">Calendrier académique</a></li>
        <li><a href="${root}pages/examens.html" style="color:rgba(255,255,255,0.8);text-decoration:none;">Gestion des examens</a></li>
        <li><a href="${root}pages/verif_diplome.html" style="color:rgba(255,255,255,0.8);text-decoration:none;">Vérification Diplôme</a></li>
        <li><a href="${root}pages/opendata.html" style="color:rgba(255,255,255,0.8);text-decoration:none;">API OpenData</a></li>
        <li><a href="${root}tests.html" style="color:rgba(255,255,255,0.8);text-decoration:none;">🧪 Tests</a></li>
      </ul>
    </div>
    <div>
      <h3 style="color:white;">Contact</h3>
      <p><i class="fas fa-envelope"></i> contact@itp-university.cg</p>
      <p><i class="fas fa-phone"></i> +242 06 434 69 89</p>
      <p><i class="fas fa-map-marker-alt"></i> 19, rue 5 fév. 1978<br>Poto-Poto, Brazzaville, Congo</p>
    </div>
    <div>
      <h3 style="color:white;">Réseaux</h3>
      <div style="font-size:1.8rem;display:flex;gap:12px;margin-bottom:20px;">
        <a href="#" style="color:rgba(255,255,255,0.8);"><i class="fab fa-facebook"></i></a>
        <a href="#" style="color:rgba(255,255,255,0.8);"><i class="fab fa-twitter"></i></a>
        <a href="#" style="color:rgba(255,255,255,0.8);"><i class="fab fa-linkedin"></i></a>
        <a href="#" style="color:rgba(255,255,255,0.8);"><i class="fab fa-instagram"></i></a>
      </div>
      <button onclick="installPWA()" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);padding:8px 16px;border-radius:5px;cursor:pointer;width:100%;">
        <i class="fas fa-download"></i> Installer l'app
      </button>
    </div>
  </div>
  <div style="text-align:center;margin-top:40px;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;opacity:0.75;font-size:0.85rem;">
    &copy; 2026 ITP University — Brazzaville, République du Congo. Tous droits réservés.
  </div>
</footer>`;

  function logoutUser() {
    localStorage.removeItem('itp_token');
    localStorage.removeItem('itp_user');
    window.location.href = root + 'index.html';
  }
  window.logoutUser = logoutUser;

  window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    const btn  = document.querySelector('.mobile-menu-toggle');
    const isOpen = menu.style.display === 'block';
    menu.style.display = isOpen ? 'none' : 'block';
    btn.setAttribute('aria-expanded', !isOpen);
    btn.innerHTML = isOpen ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
  };

  // Injecter
  const headerEl = document.getElementById('itp-header');
  const footerEl = document.getElementById('itp-footer');
  if (headerEl) headerEl.innerHTML = header;
  if (footerEl) footerEl.innerHTML = footer;

  // Active nav link
  const currentFile = path.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu .nav-link').forEach(a => {
    if (a.getAttribute('href')?.endsWith(currentFile)) a.style.color = 'var(--red-itp)';
  });
})();
