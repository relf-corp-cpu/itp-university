/**
 * ITP University — Configuration centrale API
 * ============================================
 * Switche automatiquement entre :
 *   - Supabase  → GitHub Pages (démo publique)
 *   - Laravel   → XAMPP local (production)
 */

const ITP_CONFIG = (() => {

  // ── Détection de l'environnement ──────────────────────────────────────────
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  // ── Paramètres Supabase ───────────────────────────────────────────────────
  // Remplace ces valeurs par celles de ton projet Supabase :
  //   1. Va sur https://supabase.com → New project → "itp_university"
  //   2. Settings → API → copie "Project URL" et "anon public key"
  const SUPABASE_URL    = 'https://teqcoroyanfxcbcwheom.supabase.co';
  const SUPABASE_ANON   = 'sb_publishable_EcjZzrQ47IRHVLTiWqBI7Q_9x9RYPON';

  // ── Paramètres Laravel (XAMPP) ────────────────────────────────────────────
  const LARAVEL_URL     = 'http://localhost/itp_laravel/api/v1';

  // ── Sélection automatique ─────────────────────────────────────────────────
  const mode = isLocal ? 'laravel' : 'supabase';

  return {
    mode,
    supabase: { url: SUPABASE_URL, key: SUPABASE_ANON },
    laravel:  { url: LARAVEL_URL },

    /** URL de base de l'API active */
    apiBase() {
      return mode === 'laravel' ? LARAVEL_URL : `${SUPABASE_URL}/rest/v1`;
    },

    /** Headers communs selon le mode */
    headers(extra = {}) {
      if (mode === 'laravel') {
        return {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
          ...extra
        };
      }
      return {
        'Content-Type':   'application/json',
        'apikey':         SUPABASE_ANON,
        'Authorization':  `Bearer ${SUPABASE_ANON}`,
        'Prefer':         'return=representation',
        ...extra
      };
    },

    /** Headers avec JWT utilisateur (après login) */
    authHeaders() {
      const token = localStorage.getItem('itp_token');
      if (mode === 'laravel') {
        return this.headers({ 'Authorization': `Bearer ${token}` });
      }
      return {
        ...this.headers(),
        'Authorization': `Bearer ${token || SUPABASE_ANON}`
      };
    }
  };
})();

window.ITP_CONFIG = ITP_CONFIG;
console.log(`[ITP] Mode API : ${ITP_CONFIG.mode.toUpperCase()}`);
