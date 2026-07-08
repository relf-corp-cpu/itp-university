/**
 * ITP University — Couche API unifiée
 * =====================================
 * Toutes les fonctions retournent des Promises.
 * Fonctionnent avec Supabase ET Laravel sans changer le code des pages.
 */

const ITP_API = (() => {
  const cfg = () => window.ITP_CONFIG;

  // ────────────────────────────────────────────────────────────────────────────
  // Helper fetch interne
  // ────────────────────────────────────────────────────────────────────────────
  async function req(endpoint, options = {}) {
    const base   = cfg().apiBase();
    const url    = `${base}${endpoint}`;
    const res    = await fetch(url, {
      headers: options.auth ? cfg().authHeaders() : cfg().headers(),
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erreur ${res.status}`);
    }
    return res.json();
  }

  // Helper pour construire les query params Supabase vs Laravel
  function buildUrl(endpoint, params = {}) {
    if (cfg().mode === 'supabase') {
      // Supabase REST : ?column=eq.value&select=*
      const q = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      return `${endpoint}${q ? '?' + q : ''}`;
    }
    // Laravel : query string classique
    const q = new URLSearchParams(params).toString();
    return `${endpoint}${q ? '?' + q : ''}`;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // AUTH
  // ────────────────────────────────────────────────────────────────────────────
  const auth = {
    async login(username, password) {
      if (cfg().mode === 'laravel') {
        const data = await req('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        if (data.token) localStorage.setItem('itp_token', data.token);
        if (data.user)  localStorage.setItem('itp_user',  JSON.stringify(data.user));
        return data;
      }
      // Supabase : table users avec mot de passe hashé (démo simplifiée)
      const cfg2 = cfg();
      const res  = await fetch(
        `${cfg2.supabase.url}/rest/v1/users?username=eq.${username}&select=*`,
        { headers: cfg2.headers() }
      );
      const users = await res.json();
      if (!users.length) throw new Error('Utilisateur introuvable');
      // En prod utilise Supabase Auth. Pour la démo on stocke en clair
      const user = users[0];
      localStorage.setItem('itp_token', cfg2.supabase.key);
      localStorage.setItem('itp_user',  JSON.stringify(user));
      return { user };
    },

    logout() {
      localStorage.removeItem('itp_token');
      localStorage.removeItem('itp_user');
      window.location.href = window.ITP_CONFIG.mode === 'laravel'
        ? '/itp_laravel/index.php'
        : '../index.html';
    },

    currentUser() {
      const u = localStorage.getItem('itp_user');
      return u ? JSON.parse(u) : null;
    },

    isLoggedIn() {
      return !!localStorage.getItem('itp_token');
    },

    role() {
      const u = this.currentUser();
      return u ? u.role : null;
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ÉTUDIANTS
  // ────────────────────────────────────────────────────────────────────────────
  const students = {
    async getAll() {
      if (cfg().mode === 'laravel')
        return req('/students', { auth: true });
      return req('/students?select=*,users(name,email)', { auth: true });
    },

    async getById(id) {
      if (cfg().mode === 'laravel')
        return req(`/students/${id}`, { auth: true });
      const data = await req(`/students?id=eq.${id}&select=*,users(name,email)`, { auth: true });
      return data[0];
    },

    async create(data) {
      if (cfg().mode === 'laravel')
        return req('/students', { method: 'POST', body: JSON.stringify(data), auth: true });
      return req('/students', { method: 'POST', body: JSON.stringify(data), auth: true });
    },

    async search(query) {
      if (cfg().mode === 'laravel')
        return req(`/students?search=${query}`, { auth: true });
      return req(`/students?or=(first_name.ilike.*${query}*,last_name.ilike.*${query}*,student_id_card.ilike.*${query}*)&select=*`, { auth: true });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // NOTES / ÉVALUATIONS
  // ────────────────────────────────────────────────────────────────────────────
  const grades = {
    async getByStudent(studentId) {
      if (cfg().mode === 'laravel')
        return req(`/grades?student_id=${studentId}`, { auth: true });
      return req(`/grades?student_id=eq.${studentId}&select=*`, { auth: true });
    },

    async getAll() {
      if (cfg().mode === 'laravel')
        return req('/grades', { auth: true });
      return req('/grades?select=*,students(first_name,last_name),courses(name)', { auth: true });
    },

    async create(data) {
      const method = cfg().mode === 'laravel' ? 'POST' : 'POST';
      const url    = cfg().mode === 'laravel' ? '/grades' : '/grades';
      return req(url, { method, body: JSON.stringify(data), auth: true });
    },

    calculate(dst, session, tp = null) {
      if (tp !== null && tp > 0)
        return parseFloat(((dst * 0.3) + (tp * 0.2) + (session * 0.5)).toFixed(2));
      return parseFloat(((dst * 0.3) + (session * 0.7)).toFixed(2));
    },

    status(moyenne) {
      if (moyenne >= 10) return { label: 'Admis',       color: 'green' };
      if (moyenne >= 8)  return { label: 'Compensable', color: 'orange' };
      return               { label: 'Ajourné',     color: 'red' };
    },

    async calculateAPI(dst, session, tp = null) {
      if (cfg().mode === 'laravel') {
        return req('/notes/calculate', {
          method: 'POST',
          body: JSON.stringify({ dst, session, tp })
        });
      }
      // Supabase n'a pas cet endpoint → calcul côté client
      return { moyenne: this.calculate(dst, session, tp) };
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // PAIEMENTS
  // ────────────────────────────────────────────────────────────────────────────
  const payments = {
    async getByStudent(studentId) {
      if (cfg().mode === 'laravel')
        return req(`/payments?student_id=${studentId}`, { auth: true });
      return req(`/payments?student_id=eq.${studentId}&select=*&order=payment_date.desc`, { auth: true });
    },

    async create(data) {
      return req('/payments', {
        method: 'POST',
        body:   JSON.stringify(data),
        auth:   true
      });
    },

    async getHistory() {
      if (cfg().mode === 'laravel')
        return req('/payments/history', { auth: true });
      return req('/payments?select=*,students(first_name,last_name)&order=payment_date.desc&limit=50', { auth: true });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // PRÉSENCES
  // ────────────────────────────────────────────────────────────────────────────
  const attendances = {
    async getByCourse(courseId, date) {
      if (cfg().mode === 'laravel')
        return req(`/attendances?course_id=${courseId}&date=${date}`, { auth: true });
      return req(`/attendances?schedule_id=eq.${courseId}&select=*,students(first_name,last_name)`, { auth: true });
    },

    async save(records) {
      if (cfg().mode === 'laravel')
        return req('/attendances/bulk', {
          method: 'POST',
          body:   JSON.stringify({ records }),
          auth:   true
        });
      // Supabase: upsert
      return req('/attendances', {
        method:  'POST',
        body:    JSON.stringify(records),
        auth:    true,
        headers: { ...cfg().headers(), 'Prefer': 'resolution=merge-duplicates' }
      });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // COURS / EMPLOI DU TEMPS
  // ────────────────────────────────────────────────────────────────────────────
  const courses = {
    async getAll() {
      if (cfg().mode === 'laravel')
        return req('/courses', { auth: true });
      return req('/courses?select=*,professors(first_name,last_name),ues(name)', { auth: true });
    },

    async getSchedule() {
      if (cfg().mode === 'laravel')
        return req('/schedules', { auth: true });
      return req('/schedules?select=*,courses(name),rooms(name,campus_id)&order=start_time.asc', { auth: true });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ────────────────────────────────────────────────────────────────────────────
  const notifications = {
    async getForUser(userId) {
      if (cfg().mode === 'laravel')
        return req(`/notifications?user_id=${userId}`, { auth: true });
      return req(`/notifications?user_id=eq.${userId}&order=created_at.desc&limit=10`, { auth: true });
    },

    async markRead(id) {
      if (cfg().mode === 'laravel')
        return req(`/notifications/${id}/read`, { method: 'PATCH', auth: true });
      return req(`/notifications?id=eq.${id}`, {
        method: 'PATCH',
        body:   JSON.stringify({ is_read: true }),
        auth:   true
      });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RÉCLAMATIONS
  // ────────────────────────────────────────────────────────────────────────────
  const complaints = {
    async create(data) {
      return req('/complaints', {
        method: 'POST',
        body:   JSON.stringify(data),
        auth:   true
      });
    },

    async getAll() {
      if (cfg().mode === 'laravel')
        return req('/complaints', { auth: true });
      return req('/complaints?select=*,students(first_name,last_name)&order=id.desc', { auth: true });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // STATISTIQUES (admin)
  // ────────────────────────────────────────────────────────────────────────────
  const stats = {
    async getDashboard() {
      if (cfg().mode === 'laravel')
        return req('/stats/dashboard', { auth: true });
      // Supabase : plusieurs appels parallèles
      const [students, payments, complaints] = await Promise.all([
        fetch(`${cfg().supabase.url}/rest/v1/students?select=count`, { headers: cfg().headers() }).then(r => r.json()),
        fetch(`${cfg().supabase.url}/rest/v1/payments?select=amount&status=eq.completed`, { headers: cfg().headers() }).then(r => r.json()),
        fetch(`${cfg().supabase.url}/rest/v1/complaints?select=count&status=eq.open`, { headers: cfg().headers() }).then(r => r.json()),
      ]);
      return {
        total_etudiants: students[0]?.count || 0,
        revenus_mois:    payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0),
        reclamations:    complaints[0]?.count || 0,
      };
    },

    async getPublic() {
      if (cfg().mode === 'laravel')
        return req('/stats/inscriptions');
      return req('/settings?select=setting_key,setting_value');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // BIBLIOTHÈQUE
  // ────────────────────────────────────────────────────────────────────────────
  const library = {
    async getBooks(search = '') {
      if (cfg().mode === 'laravel')
        return req(`/library/books${search ? '?search=' + search : ''}`);
      const filter = search ? `&or=(title.ilike.*${search}*,author.ilike.*${search}*)` : '';
      return req(`/library_books?select=*${filter}`);
    },

    async borrow(bookId, studentId) {
      return req('/book_loans', {
        method: 'POST',
        body:   JSON.stringify({
          book_id:    bookId,
          student_id: studentId,
          loan_date:  new Date().toISOString().split('T')[0]
        }),
        auth: true
      });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // BOURSES
  // ────────────────────────────────────────────────────────────────────────────
  const scholarships = {
    async getAll() {
      if (cfg().mode === 'laravel')
        return req('/scholarships');
      return req('/scholarships?select=*');
    },

    async apply(scholarshipId, studentId) {
      return req('/scholarship_applications', {
        method: 'POST',
        body:   JSON.stringify({ scholarship_id: scholarshipId, student_id: studentId }),
        auth:   true
      });
    },

    async getApplications(studentId) {
      if (cfg().mode === 'laravel')
        return req(`/scholarships/applications?student_id=${studentId}`, { auth: true });
      return req(`/scholarship_applications?student_id=eq.${studentId}&select=*,scholarships(name,amount)`, { auth: true });
    }
  };

  return { auth, students, grades, payments, attendances, courses, notifications, complaints, stats, library, scholarships };
})();

window.ITP_API = ITP_API;

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : ÉVÉNEMENTS
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.events = {
  async getAll() {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/events`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/events?select=*&order=event_date.asc`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
  },
  async create(data) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/events`, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/events`, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : ACTUALITÉS (articles)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.articles = {
  async getAll(limit = 10) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/articles?limit=${limit}`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/articles?select=*&order=published_at.desc&limit=${limit}`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
  },
  async create(data) {
    const url = ITP_CONFIG.mode === 'laravel'
      ? `${ITP_CONFIG.laravel.url}/articles`
      : `${ITP_CONFIG.supabase.url}/rest/v1/articles`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : FORUM
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.forum = {
  async getTopics() {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/forum/topics`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/forum_topics?select=*,users(name),forums(name)&order=id.desc`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
  },
  async createTopic(data) {
    const url = ITP_CONFIG.mode === 'laravel'
      ? `${ITP_CONFIG.laravel.url}/forum/topics`
      : `${ITP_CONFIG.supabase.url}/rest/v1/forum_topics`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  },
  async getReplies(topicId) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/forum/topics/${topicId}/replies`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/forum_replies?topic_id=eq.${topicId}&select=*,users(name)&order=id.asc`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
  },
  async createReply(data) {
    const url = ITP_CONFIG.mode === 'laravel'
      ? `${ITP_CONFIG.laravel.url}/forum/replies`
      : `${ITP_CONFIG.supabase.url}/rest/v1/forum_replies`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : EMPLOI DU TEMPS
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.schedules = {
  async getForStudent(studentId) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/schedules?student_id=${studentId}`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/schedules?select=*,courses(name,professor_id,professors(first_name,last_name)),rooms(name,campus_id)&order=start_time.asc`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async getForProfessor(professorId) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/schedules?professor_id=${professorId}`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/schedules?select=*,courses(name),rooms(name)&order=start_time.asc`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async getAll() {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/schedules`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/schedules?select=*,courses(name),rooms(name,campus_id)&order=start_time.asc`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : NOTES DÉTAILLÉES (évaluations par cours)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.evaluations = {
  async getByStudent(studentId) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/evaluations?student_id=${studentId}`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/evaluations?student_id=eq.${studentId}&select=*,courses(name)&order=id.asc`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async createBulk(records) {
    const url = ITP_CONFIG.mode === 'laravel'
      ? `${ITP_CONFIG.laravel.url}/evaluations/bulk`
      : `${ITP_CONFIG.supabase.url}/rest/v1/evaluations`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(records) }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : STAGES (offres + candidatures)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.internships = {
  async getOffers() {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/internships/offers`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/internships?select=*,companies(name,contact_email)&order=id.desc`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
  },
  async apply(studentId, internshipId) {
    const url = ITP_CONFIG.mode === 'laravel'
      ? `${ITP_CONFIG.laravel.url}/internships/apply`
      : `${ITP_CONFIG.supabase.url}/rest/v1/internship_applications`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify({ student_id: studentId, internship_id: internshipId, status:'pending' }) }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : DÉLIBÉRATIONS (direction)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.deliberations = {
  async getAll() {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/deliberations`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/deliberations?select=*,students(first_name,last_name),ues(name)&order=id.desc`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async create(data) {
    const url = ITP_CONFIG.mode === 'laravel'
      ? `${ITP_CONFIG.laravel.url}/deliberations`
      : `${ITP_CONFIG.supabase.url}/rest/v1/deliberations`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : PRÉ-INSCRIPTIONS (secrétariat)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.registrations = {
  async getPending() {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/registrations?status=pending`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/pre_registrations?status=eq.pending&select=*&order=created_at.desc`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async submit(data) {
    const url = ITP_CONFIG.mode === 'laravel'
      ? `${ITP_CONFIG.laravel.url}/registrations`
      : `${ITP_CONFIG.supabase.url}/rest/v1/pre_registrations`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.headers(), body: JSON.stringify(data) }).then(r => r.json());
  },
  async validate(id) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/registrations/${id}/validate`, { method:'PATCH', headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/pre_registrations?id=eq.${id}`, { method:'PATCH', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify({ status:'validated' }) }).then(r => r.json());
  }
};

console.log('[ITP] api.js chargé — modules: auth, students, grades, payments, attendances, courses, notifications, complaints, stats, library, scholarships, events, articles, forum, schedules, evaluations, internships, deliberations, registrations');

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : ADMIN (settings, backup, search)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.admin = {
  async getSettings() {
    return fetch(`${ITP_CONFIG.apiBase()}/admin/settings`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async updateSettings(data) {
    return fetch(`${ITP_CONFIG.apiBase()}/admin/settings`, {
      method:'PUT', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data)
    }).then(r => r.json());
  },
  async backup() {
    return fetch(`${ITP_CONFIG.apiBase()}/admin/backup`, { method:'POST', headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async globalSearch(params) {
    const q = new URLSearchParams(params).toString();
    return fetch(`${ITP_CONFIG.apiBase()}/admin/search?${q}`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async getLogs(filters = {}) {
    const q = new URLSearchParams(filters).toString();
    return fetch(`${ITP_CONFIG.apiBase()}/admin/logs?${q}`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async dashboard() {
    return fetch(`${ITP_CONFIG.apiBase()}/admin/dashboard`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : USERS (gestion complète)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.users = {
  async getAll(filters = {}) {
    const q = new URLSearchParams(filters).toString();
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/users?${q}`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/users?select=*`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async create(data) {
    const url = ITP_CONFIG.mode === 'laravel' ? `${ITP_CONFIG.laravel.url}/users` : `${ITP_CONFIG.supabase.url}/rest/v1/users`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  },
  async update(id, data) {
    const url = ITP_CONFIG.mode === 'laravel' ? `${ITP_CONFIG.laravel.url}/users/${id}` : `${ITP_CONFIG.supabase.url}/rest/v1/users?id=eq.${id}`;
    return fetch(url, { method: ITP_CONFIG.mode==='laravel'?'PUT':'PATCH', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  },
  async remove(id) {
    const url = ITP_CONFIG.mode === 'laravel' ? `${ITP_CONFIG.laravel.url}/users/${id}` : `${ITP_CONFIG.supabase.url}/rest/v1/users?id=eq.${id}`;
    return fetch(url, { method:'DELETE', headers: ITP_CONFIG.authHeaders() });
  },
  async stats() {
    return fetch(`${ITP_CONFIG.apiBase()}/users/stats`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : MESSAGING (chat interne)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.messaging = {
  async getConversations(userId) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/messages/conversations`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/conversations?or=(user1_id.eq.${userId},user2_id.eq.${userId})&select=*`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async getMessages(conversationId) {
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/messages/${conversationId}`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/messages?conversation_id=eq.${conversationId}&select=*&order=created_at.asc`, { headers: ITP_CONFIG.authHeaders() }).then(r => r.json());
  },
  async send(conversationId, content) {
    const url = ITP_CONFIG.mode === 'laravel' ? `${ITP_CONFIG.laravel.url}/messages` : `${ITP_CONFIG.supabase.url}/rest/v1/messages`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify({ conversation_id: conversationId, content }) }).then(r => r.json());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE : MEMOIRES (fin d'études)
// ─────────────────────────────────────────────────────────────────────────────
ITP_API.memoires = {
  async getAll(filters = {}) {
    const q = new URLSearchParams(filters).toString();
    if (ITP_CONFIG.mode === 'laravel')
      return fetch(`${ITP_CONFIG.laravel.url}/memoires?${q}`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
    return fetch(`${ITP_CONFIG.supabase.url}/rest/v1/memoires?select=*&${q}`, { headers: ITP_CONFIG.headers() }).then(r => r.json());
  },
  async submit(data) {
    const url = ITP_CONFIG.mode === 'laravel' ? `${ITP_CONFIG.laravel.url}/memoires` : `${ITP_CONFIG.supabase.url}/rest/v1/memoires`;
    return fetch(url, { method:'POST', headers: ITP_CONFIG.authHeaders(), body: JSON.stringify(data) }).then(r => r.json());
  }
};

console.log('[ITP] api.js v2 chargé — +admin, users, messaging, memoires');
