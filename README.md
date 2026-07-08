# 🎓 ITP University System — Brazzaville

**Institut Technique Polytechnique (ITP)**  
19, rue 5 février 1978 — Poto-Poto, Brazzaville, République du Congo

---

## 🌐 Architecture

```
┌────────────────────────────────────────────────────────┐
│               FRONTEND (GitHub Pages)                  │
│  HTML/CSS/JS  ←→  assets/js/config.js                 │
│                         ↓ auto-détection               │
│        ┌────────────────┴────────────────┐             │
│        │                                 │             │
│   localhost?                       github.io?          │
│        ↓                                ↓              │
│  Laravel API                      Supabase API         │
│  (XAMPP local)                (PostgreSQL en ligne)    │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Déploiement GitHub Pages + Supabase

### Étape 1 — Créer le projet Supabase

1. Aller sur [https://supabase.com](https://supabase.com) → **New project**
2. Nom : `itp-university` | Mot de passe BDD fort | Région : `eu-central-1`
3. Attendre l'initialisation (~2 min)

### Étape 2 — Importer la base de données

1. Dans Supabase → **SQL Editor** → **New Query**
2. Coller le contenu de `supabase_setup.sql`
3. Cliquer **Run** ✅

### Étape 3 — Configurer `assets/js/config.js`

Ouvrir `assets/js/config.js` et remplacer :

```js
const SUPABASE_URL  = 'https://VOTRE_ID.supabase.co';    // Settings → API → Project URL
const SUPABASE_ANON = 'VOTRE_ANON_KEY';                  // Settings → API → anon public
```

### Étape 4 — Déployer sur GitHub Pages

1. Créer un dépôt GitHub nommé `itp-university`
2. Uploader tous les fichiers à la **racine** du repo
3. **Settings → Pages → Branch: main → / (root)** → Save
4. Site disponible : `https://[username].github.io/itp-university/`

---

## ⚡ Déploiement XAMPP + Laravel (production)

### Étape 1 — Installer

```bash
# Copier le projet dans XAMPP
# Chemin : C:\xampp\htdocs\itp_laravel\

# Installer les dépendances
composer install

# Configurer .env (déjà pré-configuré)
# DB_HOST=127.0.0.1 | DB_PORT=3306 | DB_DATABASE=university_system_itp

# Créer la base de données
php artisan key:generate
php artisan migrate --seed
```

### Étape 2 — Accéder

- Site : `http://localhost/itp_laravel/`
- Installer : `http://localhost/itp_laravel/install.php`

### Étape 3 — Le frontend détecte automatiquement Laravel

Quand le site est ouvert sur `localhost`, `config.js` bascule automatiquement vers l'API Laravel.

---

## 👤 Comptes de démonstration

| Identifiant   | Mot de passe  | Rôle          |
|---------------|---------------|---------------|
| admin_itp     | Admin@2026    | Administrateur |
| prof_michel   | Prof@2026     | Professeur    |
| djepht        | Student@2026  | Étudiant      |
| secretaire    | Secr@2026     | Secrétariat   |
| directeur     | Dir@2026      | Direction     |

---

## 📁 Structure des fichiers JS

```
assets/js/
├── config.js      ← Configuration centrale (Supabase/Laravel)
├── api.js         ← Couche API unifiée (tous les appels BDD)
├── main.js        ← UI : chatbot, accordion, active nav
└── components.js  ← Header/footer injectés dynamiquement
```

---

## 📞 Contact ITP

- 📧 contact@itp-university.cg
- 📞 +242 06 434 69 89 / 06 599 84 71 / 05 556 99 85
- 📍 Poto-Poto, Brazzaville, République du Congo
