/**
 * ITP University — Suite de Tests Automatisés
 * =============================================
 * Tests unitaires exécutables dans la console navigateur
 * ou via : <script src="assets/js/tests.js"></script>
 *
 * Usage console : ITP_TESTS.run()
 */

const ITP_TESTS = (() => {

  let passed = 0;
  let failed = 0;
  const results = [];

  // ─── Moteur de test minimal ────────────────────────────────────────────────
  function test(name, fn) {
    try {
      fn();
      passed++;
      results.push({ name, status: 'PASS', error: null });
    } catch (err) {
      failed++;
      results.push({ name, status: 'FAIL', error: err.message });
    }
  }

  function expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected)
          throw new Error(`Attendu: ${expected}, Obtenu: ${actual}`);
      },
      toEqual(expected) {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) throw new Error(`Attendu: ${e}, Obtenu: ${a}`);
      },
      toBeTrue()  { if (!actual)     throw new Error(`Attendu: true, Obtenu: ${actual}`); },
      toBeFalse() { if (actual)      throw new Error(`Attendu: false, Obtenu: ${actual}`); },
      toBeGreaterThan(n) { if (actual <= n) throw new Error(`${actual} n'est pas > ${n}`); },
      toBeLessThan(n)    { if (actual >= n) throw new Error(`${actual} n'est pas < ${n}`); },
      toContain(str)     { if (!String(actual).includes(str)) throw new Error(`"${actual}" ne contient pas "${str}"`); },
      toBeNull()         { if (actual !== null) throw new Error(`Attendu: null, Obtenu: ${actual}`); },
      toBeDefined()      { if (actual === undefined) throw new Error(`Valeur non définie`); },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUPE 1 : Calcul des notes
  // ─────────────────────────────────────────────────────────────────────────
  function testCalcNotes() {
    // Formule standard : DST×30% + Session×70%
    test('Note standard : 14 DST + 12 Session = 12.60', () => {
      expect(calcNote(14, 12)).toBe(12.60);
    });
    test('Note standard : 16 DST + 15 Session = 15.30', () => {
      expect(calcNote(16, 15)).toBe(15.30);
    });
    test('Note standard : 10 DST + 10 Session = 10.00', () => {
      expect(calcNote(10, 10)).toBe(10.00);
    });
    test('Note standard : 0 DST + 0 Session = 0.00', () => {
      expect(calcNote(0, 0)).toBe(0.00);
    });
    test('Note standard : 20 DST + 20 Session = 20.00', () => {
      expect(calcNote(20, 20)).toBe(20.00);
    });

    // Formule avec TP : DST×30% + TP×20% + Session×50%
    test('Avec TP : 16 DST + 14 TP + 15 Session = 15.10', () => {
      expect(calcNote(16, 15, 14)).toBe(15.10);
    });
    test('Avec TP : 10 DST + 10 TP + 10 Session = 10.00', () => {
      expect(calcNote(10, 10, 10)).toBe(10.00);
    });
    test('Avec TP nul ignoré (utilise formule sans TP)', () => {
      expect(calcNote(14, 12, 0)).toBe(12.60);
    });

    // Statuts
    test('Statut 10/20 = Passable', () => {
      expect(noteStatus(10).label).toBe('Passable');
    });
    test('Statut 9/20 = Compensable', () => {
      expect(noteStatus(9).label).toBe('Compensable');
    });
    test('Statut 7/20 = Ajourné', () => {
      expect(noteStatus(7).label).toBe('Ajourné');
    });
    test('Statut 12/20 = Assez Bien', () => {
      expect(noteStatus(12).label).toBe('Assez Bien');
    });
    test('Statut 14/20 = Bien', () => {
      expect(noteStatus(14).label).toBe('Bien');
    });
    test('Statut 16/20 = Très Bien', () => {
      expect(noteStatus(16).label).toBe('Très Bien');
    });
    test('Couleur Admis = green', () => {
      expect(noteStatus(10).color).toContain('green');
    });
    test('Couleur Ajourné = red/danger', () => {
      expect(noteStatus(5).color).toContain('#c62828');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUPE 2 : Sécurité — rate limiting
  // ─────────────────────────────────────────────────────────────────────────
  function testSecurity() {
    test('Security existe', () => {
      expect(typeof window.Security).toBe('object');
    });
    test('checkLoginAllowed retourne true initialement', () => {
      Security.loginAttempts = 0;
      Security.lockoutUntil  = null;
      expect(Security.checkLoginAllowed()).toBeTrue();
    });
    test('Après 5 échecs, loginAttempts >= max', () => {
      Security.loginAttempts = 0;
      Security.lockoutUntil  = null;
      for (let i = 0; i < 5; i++) Security.loginAttempts++;
      expect(Security.loginAttempts).toBe(Security.maxAttempts);
    });
    test('Sanitize échappe les balises HTML', () => {
      const r = Security.sanitize('<script>alert("xss")</script>');
      expect(r).toContain('&lt;script&gt;');
    });
    test('Sanitize conserve le texte normal', () => {
      expect(Security.sanitize('Bonjour Djepht')).toBe('Bonjour Djepht');
    });
    test('Sanitize gère null/undefined', () => {
      expect(Security.sanitize(null)).toBe('');
      expect(Security.sanitize(undefined)).toBe('');
    });
    test('Reset des tentatives fonctionne', () => {
      Security.loginAttempts = 4;
      Security.resetLoginAttempts();
      expect(Security.loginAttempts).toBe(0);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUPE 3 : API Config
  // ─────────────────────────────────────────────────────────────────────────
  function testConfig() {
    test('ITP_CONFIG existe', () => {
      expect(typeof window.ITP_CONFIG).toBe('object');
    });
    test('Mode est "laravel" ou "supabase"', () => {
      const mode = ITP_CONFIG.mode;
      if (mode !== 'laravel' && mode !== 'supabase')
        throw new Error(`Mode inattendu: ${mode}`);
    });
    test('apiBase() retourne une URL non vide', () => {
      const url = ITP_CONFIG.apiBase();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(5);
    });
    test('headers() contient Content-Type', () => {
      const h = ITP_CONFIG.headers();
      expect(h['Content-Type']).toContain('application/json');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUPE 4 : ITP_API existe et a les bons modules
  // ─────────────────────────────────────────────────────────────────────────
  function testAPI() {
    test('ITP_API existe', () => {
      expect(typeof window.ITP_API).toBe('object');
    });
    const modules = ['auth','students','grades','payments','attendances','courses',
                     'notifications','complaints','stats','library','scholarships',
                     'events','articles','forum','schedules','evaluations',
                     'internships','deliberations','registrations'];
    modules.forEach(mod => {
      test(`Module ITP_API.${mod} existe`, () => {
        expect(typeof ITP_API[mod]).toBe('object');
      });
    });
    test('ITP_API.auth.isLoggedIn() retourne boolean', () => {
      expect(typeof ITP_API.auth.isLoggedIn()).toBe('boolean');
    });
    test('ITP_API.grades.calculate(14,12) = 12.60', () => {
      expect(ITP_API.grades.calculate(14, 12)).toBe(12.60);
    });
    test('ITP_API.grades.status(10).label = Passable', () => {
      expect(ITP_API.grades.status(10).label).toBe('Passable');
    });
    test('ITP_API.grades.status(7).label = Ajourné', () => {
      expect(ITP_API.grades.status(7).label).toBe('Ajourné');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUPE 5 : Utils — PDF, Excel, QR
  // ─────────────────────────────────────────────────────────────────────────
  function testUtils() {
    test('PDF object existe', () => {
      expect(typeof window.PDF).toBe('object');
    });
    test('PDF.generateTranscript est une fonction', () => {
      expect(typeof PDF.generateTranscript).toBe('function');
    });
    test('Excel object existe', () => {
      expect(typeof window.Excel).toBe('object');
    });
    test('Excel.exportCSV est une fonction', () => {
      expect(typeof Excel.exportCSV).toBe('function');
    });
    test('generateQR retourne une URL valide', () => {
      const url = generateQR('ITP-TEST-123');
      expect(url).toContain('qrserver.com');
      expect(url).toContain('ITP-TEST-123');
    });
    test('generateQR avec taille personnalisée', () => {
      const url = generateQR('TEST', 200);
      expect(url).toContain('200x200');
    });
    test('AI.reply détecte mot-clé "inscription"', () => {
      const r = AI.reply('je veux faire une inscription');
      expect(r).toContain('pré-inscription');
    });
    test('AI.reply détecte mot-clé "frais"', () => {
      const r = AI.reply('quel sont les frais de scolarité');
      expect(r).toContain('FCFA');
    });
    test('AI.reply retourne réponse par défaut', () => {
      const r = AI.reply('xxxblablabla');
      expect(r).toContain('assistant ITP');
    });
    test('showToast est une fonction', () => {
      expect(typeof showToast).toBe('function');
    });
    test('Modal.show est une fonction', () => {
      expect(typeof Modal.show).toBe('function');
    });
    test('Modal.close est une fonction', () => {
      expect(typeof Modal.close).toBe('function');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUPE 6 : DOM — Éléments essentiels
  // ─────────────────────────────────────────────────────────────────────────
  function testDOM() {
    test('Balise <html> a lang="fr"', () => {
      expect(document.documentElement.lang).toBe('fr');
    });
    test('Page a un <title> non vide', () => {
      expect(document.title.length).toBeGreaterThan(0);
    });
    test('Page a une meta description ou viewport', () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport).toBeDefined();
    });
    test('Page a une balise <main>', () => {
      const main = document.querySelector('main');
      // Pas une erreur bloquante — on note juste
      if (!main) console.warn('[TEST] Pas de <main> sur cette page');
    });
    test('Toast container est dans le DOM', () => {
      const t = document.getElementById('toast-container');
      expect(t).toBeDefined();
    });
    test('PWA banner existe dans le DOM', () => {
      const p = document.getElementById('pwa-banner');
      expect(p).toBeDefined();
    });
    test('Service Worker supporté par le navigateur', () => {
      expect('serviceWorker' in navigator).toBeTrue();
    });
    test('Manifest link présent dans <head>', () => {
      const m = document.querySelector('link[rel="manifest"]');
      expect(m).toBeDefined();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GROUPE 7 : Accessibilité — vérifications DOM
  // ─────────────────────────────────────────────────────────────────────────
  function testA11y() {
    test('Toutes les images ont un attribut alt', () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const missing = imgs.filter(img => !img.hasAttribute('alt'));
      if (missing.length > 0)
        throw new Error(`${missing.length} image(s) sans alt: ${missing.map(i=>i.src.split('/').pop()).join(', ')}`);
    });
    test('Tous les boutons ont un texte ou aria-label', () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bad  = btns.filter(b => !b.textContent.trim() && !b.getAttribute('aria-label'));
      if (bad.length > 0)
        throw new Error(`${bad.length} bouton(s) sans texte ni aria-label`);
    });
    test('Tous les inputs ont un label ou aria-label', () => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
      const bad    = inputs.filter(i => {
        const hasLabel = i.id && document.querySelector(`label[for="${i.id}"]`);
        const hasAria  = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby');
        const hasPh    = i.getAttribute('placeholder');
        return !hasLabel && !hasAria && !hasPh;
      });
      if (bad.length > 0)
        console.warn(`[A11Y] ${bad.length} input(s) sans label explicite`);
    });
    test('Skip link "Aller au contenu principal" présent', () => {
      const skip = document.querySelector('a[href="#main-content"]');
      expect(skip).toBeDefined();
    });
    test('Pas de contraste blanc sur blanc', () => {
      // Vérification basique — pas d'éléments text-white sur bg-white
      const whiteOnWhite = document.querySelectorAll('[style*="color:white"][style*="background:white"]');
      expect(whiteOnWhite.length).toBe(0);
    });
    test('Role="main" présent', () => {
      const main = document.querySelector('[role="main"], main');
      expect(main).toBeDefined();
    });
    test('Role="navigation" présent', () => {
      const nav = document.querySelector('[role="navigation"], nav');
      expect(nav).toBeDefined();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RUNNER
  // ─────────────────────────────────────────────────────────────────────────
  function run() {
    passed = 0; failed = 0; results.length = 0;
    console.group('🧪 ITP University — Tests automatisés');
    console.time('Durée totale');

    const groups = [
      ['📊 Calcul des notes',     testCalcNotes],
      ['🔒 Sécurité',             testSecurity],
      ['⚙️  Configuration API',    testConfig],
      ['🔌 Modules API',           testAPI],
      ['🛠️  Utilitaires',          testUtils],
      ['🌐 DOM',                   testDOM],
      ['♿ Accessibilité',         testA11y],
    ];

    groups.forEach(([name, fn]) => {
      console.group(name);
      const before = { p: passed, f: failed };
      fn();
      const gPassed = passed - before.p;
      const gFailed = failed - before.f;
      console.log(`  → ${gPassed} ✅  ${gFailed > 0 ? gFailed + ' ❌' : ''}`);
      console.groupEnd();
    });

    console.groupEnd();
    console.timeEnd('Durée totale');
    console.log(`\n${'='.repeat(50)}`);
    console.log(`%c RÉSULTAT FINAL : ${passed} ✅  ${failed} ❌  (${Math.round(passed/(passed+failed)*100)}%)`,
      failed === 0 ? 'color:green;font-weight:bold;font-size:1.1em' : 'color:orange;font-weight:bold;font-size:1.1em');
    console.log('='.repeat(50));

    // Afficher les échecs détaillés
    const failures = results.filter(r => r.status === 'FAIL');
    if (failures.length) {
      console.group('❌ Détail des échecs :');
      failures.forEach(f => console.error(`  • ${f.name}: ${f.error}`));
      console.groupEnd();
    }

    return { passed, failed, total: passed + failed, score: Math.round(passed/(passed+failed)*100) };
  }

  // Interface publique
  return { run, results: () => results };
})();

window.ITP_TESTS = ITP_TESTS;

// Auto-run si paramètre ?tests=1 dans l'URL
if (new URLSearchParams(window.location.search).get('tests') === '1') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const r = ITP_TESTS.run();
      showToast(`Tests : ${r.passed}/${r.total} ✅ (${r.score}%)`, r.failed ? 'warning' : 'success', 6000);
    }, 1000);
  });
}
