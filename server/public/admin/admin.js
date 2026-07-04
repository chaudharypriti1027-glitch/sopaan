/* Sopaan Admin Console — wired to /api/admin/* */
(function () {
  const API = `${window.location.origin}/api`;
  const TOKEN_KEY = 'sopaan_admin_token';
  const USER_KEY = 'sopaan_admin_user';

  function apiMessage(data, fallback) {
    if (!data) return fallback;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (data.error?.message) return data.error.message;
    return fallback;
  }

  function normalizeUser(raw) {
    if (!raw) return null;
    return {
      id: raw.id,
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      role: raw.role ?? 'student',
    };
  }

  let token = localStorage.getItem(TOKEN_KEY);
  let currentUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  let statsCache = null;

  const titles = {
    dashboard: 'Dashboard',
    questions: 'Questions',
    review: 'Review queue',
    tests: 'Tests & moderation',
    exams: 'Exams',
    courses: 'Courses',
    affairs: 'Current affairs',
    media: 'Media library',
    students: 'Students',
    mentors: 'Mentors',
    live: 'Live classes',
    push: 'Notifications',
    announce: 'Announcements',
    coupons: 'Coupons & offers',
    revenue: 'Payments & revenue',
    aifeedback: 'AI feedback',
    jobs: 'Jobs & automation',
    roles: 'Roles & access',
    settings: 'Settings',
  };

  const viewLoaders = {
    dashboard: loadDashboard,
    questions: () => loadQuestions('questions'),
    review: () => loadQuestions('review'),
    tests: loadTests,
    exams: loadExams,
    courses: loadCourses,
    affairs: loadAffairs,
    mentors: loadMentors,
    aifeedback: loadAiFeedback,
    jobs: loadJobs,
    students: loadStudents,
    live: loadLive,
    push: loadPush,
    announce: loadAnnounce,
    coupons: loadCoupons,
    revenue: loadRevenue,
    media: loadMedia,
    roles: loadRoles,
    settings: loadSettings,
  };

  let questionsSearchTerm = '';
  let studentsSearchTerm = '';
  let activeLiveClassId = null;
  let modalSubmitHandler = null;

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sideOverlay')?.classList.remove('open');
  }

  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sideOverlay')?.classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalBackdrop')?.classList.add('hidden');
    document.getElementById('modalBody').innerHTML = '';
    document.getElementById('modalFooter').innerHTML = '';
    modalSubmitHandler = null;
  }

  function openModal({ title, bodyHtml, footerHtml, onSubmit }) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML =
      footerHtml ||
      `<button type="button" class="tbtn ghost" id="modalCancel">Cancel</button>
       <button type="button" class="tbtn gold" id="modalSubmit">Save</button>`;
    modalSubmitHandler = onSubmit || null;
    document.getElementById('modalBackdrop').classList.remove('hidden');
    document.getElementById('modalCancel')?.addEventListener('click', closeModal);
    document.getElementById('modalSubmit')?.addEventListener('click', () => {
      if (modalSubmitHandler) void modalSubmitHandler().catch((err) => toast(err.message));
    });
  }

  function formField(id, label, attrs = '') {
    return `<div class="fld full"><label for="${id}">${label}</label><input id="${id}" ${attrs}></div>`;
  }

  function formSelect(id, label, options) {
    const opts = options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    return `<div class="fld full"><label for="${id}">${label}</label><select id="${id}">${opts}</select></div>`;
  }

  function loadingHtml(colspan, text = 'Loading…') {
    return `<tr class="loading-row"><td colspan="${colspan}">${text}</td></tr>`;
  }

  function emptyHtml(colspan, title, hint) {
    return `<tr><td colspan="${colspan}"><div class="empty-card"><b>${escapeHtml(title)}</b>${escapeHtml(hint)}</div></td></tr>`;
  }

  function wrapTables() {
    document.querySelectorAll('.tbl').forEach((table) => {
      if (table.parentElement?.classList.contains('table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  async function api(path, options = {}) {
    const headers = {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (res.status === 401) {
      logout(false);
      throw new Error('Session expired. Sign in again.');
    }
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      throw new Error(apiMessage(data, `Request failed (${res.status})`));
    }
    return data;
  }

  function logout(showGate = true) {
    token = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (showGate) {
      document.getElementById('adminApp').classList.add('hidden');
      document.getElementById('loginGate').classList.remove('hidden');
    }
  }

  async function login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      throw new Error(apiMessage(data, 'Login failed'));
    }
    const user = normalizeUser(data.user || data.profile);
    if (user?.role !== 'admin') {
      throw new Error('This account is not an admin. Use the student app for student accounts.');
    }
    token = data.token || data.accessToken;
    if (!token) {
      throw new Error('Login succeeded but no token was returned.');
    }
    currentUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    enterConsole();
  }

  async function restoreSession() {
    if (!token) return false;
    try {
      const me = await api('/me');
      const user = normalizeUser(me);
      if (user?.role !== 'admin') {
        throw new Error('Not an admin account');
      }
      currentUser = user;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      await api('/admin/stats');
      return true;
    } catch {
      return false;
    }
  }

  async function loadLoginHint() {
    try {
      const res = await fetch(`${window.location.origin}/admin/login-hint.json`);
      if (!res.ok) return;
      const hint = await res.json();
      if (!hint?.email) return;
      const emailInput = document.getElementById('loginEmail');
      const hintEl = document.getElementById('loginHint');
      if (emailInput) emailInput.placeholder = hint.email;
      if (hintEl) {
        hintEl.textContent = `Dev admin: ${hint.email} (password in server .env → SEED_ADMIN_PASSWORD)`;
        hintEl.style.display = 'block';
      }
    } catch {
      // optional dev hint
    }
  }

  function enterConsole() {
    document.getElementById('loginGate').classList.add('hidden');
    document.getElementById('adminApp').classList.remove('hidden');
    const name = currentUser?.name || 'Admin';
    const email = currentUser?.email || '—';
    document.getElementById('adminName').textContent = name;
    document.getElementById('adminEmail').textContent = email;
    document.getElementById('adminAv').textContent = initials(name);
    wrapTables();
    show('dashboard');
  }

  function initials(name) {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    return (parts[0] || 'A').slice(0, 2).toUpperCase();
  }

  window.show = function show(id) {
    closeSidebar();
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const view = document.getElementById(`v-${id}`);
    if (view) view.classList.add('active');
    document.querySelectorAll('.nav').forEach((n) => n.classList.toggle('on', n.dataset.view === id));
    document.getElementById('pageTitle').textContent = titles[id] || '';
    window.scrollTo(0, 0);
    const loader = viewLoaders[id];
    if (loader) void loader().catch((err) => toast(err.message || String(err)));
  };

  document.querySelectorAll('.nav').forEach((n) => {
    n.addEventListener('click', () => show(n.dataset.view));
  });

  let toastT;
  window.toast = function toast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2200);
  };

  function countUp(el) {
    const target = parseFloat(el.dataset.count || '0');
    const dur = 1100;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - (1 - p) ** 3;
      el.textContent = Math.round(target * e).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function pill(status) {
    const s = String(status || 'draft').toLowerCase();
    if (s === 'published' || s === 'approved' || s === 'active' || s === 'paid') {
      return `<span class="pill p-pub">${capitalize(s)}</span>`;
    }
    if (s === 'pending' || s === 'pending_review') {
      return `<span class="pill p-pend">Pending</span>`;
    }
    if (s === 'rejected') return `<span class="pill p-rev">Rejected</span>`;
    if (s === 'live') return `<span class="pill p-live">Live</span>`;
    return `<span class="pill p-draft">${capitalize(s)}</span>`;
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }

  function actions(buttons) {
    return `<div class="act">${buttons.join('')}</div>`;
  }

  function btn(label, cls, onclick) {
    return `<button class="abtn ${cls || ''}" onclick="${onclick}">${label}</button>`;
  }

  async function loadDashboard() {
    const stats = await api('/admin/stats');
    statsCache = stats;
    const s = statsCache;
    const dash = document.getElementById('v-dashboard');

    dash.querySelectorAll('[data-stat]').forEach((el) => {
      const key = el.dataset.stat;
      let val = s[key] ?? 0;
      if (key === 'mrrPaise' || key === 'revenue30dPaise') {
        el.innerHTML = `₹<span class="num">${Math.round(val / 100).toLocaleString()}</span>`;
        return;
      }
      el.dataset.count = String(val);
      el.textContent = '0';
      countUp(el);
    });

    document.querySelectorAll('.nav .badge').forEach((badge) => {
      const nav = badge.closest('.nav');
      const view = nav?.dataset.view;
      if (view === 'review') badge.textContent = String(s.pendingQuestionReviews ?? 0);
      if (view === 'tests') badge.textContent = String(s.pendingReviews ?? 0);
      if (view === 'questions') badge.textContent = formatK(s.questionsTotal ?? 0);
      if (view === 'aifeedback') badge.textContent = String(s.aiFeedbackPending ?? 0);
    });

    const greet = dash.querySelector('.greet p');
    if (greet) {
      greet.textContent = `Here's what needs your attention today · ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`;
    }
    const greetName = dash.querySelector('.greet h2');
    if (greetName && currentUser?.name) {
      greetName.textContent = `Welcome back, ${currentUser.name.split(' ')[0]}`;
    }

    updateAttemptsChart(s.attemptsDaily ?? []);
    updateSignupsChart(s.signupsDaily ?? []);
    updateContentMix(s);
    updateAlertBadge(s);

    const liveBadge = document.querySelector('.nav[data-view="live"] .badge');
    if (liveBadge) {
      if ((s.liveClasses ?? 0) > 0) {
        liveBadge.textContent = 'LIVE';
        liveBadge.classList.add('live');
      } else {
        liveBadge.textContent = String(s.liveClasses ?? 0);
        liveBadge.classList.remove('live');
      }
    }
  }

  function updateAlertBadge(s) {
    const pending = (s.pendingReviews ?? 0) + (s.pendingQuestionReviews ?? 0) + (s.aiFeedbackPending ?? 0);
    const dot = document.getElementById('alertDot');
    if (dot) dot.style.display = pending > 0 ? 'block' : 'none';
  }

  function updateAttemptsChart(series) {
    const chart = document.getElementById('attemptsChart');
    if (!chart) return;
    const rows = Array.isArray(series) ? series : [];
    if (rows.length === 0) {
      chart.innerHTML = `<p class="empty-note">No attempts in the last 14 days.</p>`;
      return;
    }
    const peak = Math.max(...rows.map((row) => row.value), 1);
    chart.innerHTML = rows
      .map((row) => {
        const height = Math.max(8, Math.round((row.value / peak) * 100));
        return `<div class="bar"><i style="height:${height}%"></i><span>${escapeHtml(row.label || '')}</span></div>`;
      })
      .join('');
  }

  function updateSignupsChart(series) {
    const chart = document.getElementById('signupsChart');
    if (!chart) return;
    const rows = Array.isArray(series) ? series : [];
    if (rows.length === 0) {
      chart.innerHTML = `<p class="empty-note">No signups in the last 14 days.</p>`;
      return;
    }
    const peak = Math.max(...rows.map((row) => row.value), 1);
    chart.innerHTML = rows
      .map((row) => {
        const height = Math.max(8, Math.round((row.value / peak) * 100));
        return `<div class="bar"><i style="height:${height}%"></i><span>${escapeHtml(row.label || '')}</span></div>`;
      })
      .join('');
  }


  function updateContentMix(s) {
    const questions = s.questionsTotal ?? 0;
    const affairs = s.currentAffairsPublished ?? 0;
    const courses = s.coursesPublished ?? 0;
    const total = questions + affairs + courses || 1;
    const qPct = Math.round((questions / total) * 100);
    const aPct = Math.round((affairs / total) * 100);
    const donut = document.getElementById('contentDonut');
    const totalEl = document.getElementById('contentTotal');
    const legend = document.getElementById('contentLegend');
    if (totalEl) totalEl.textContent = String(questions + affairs + courses);
    if (donut) {
      const cPct = Math.max(0, 100 - qPct - aPct);
      donut.style.background = `conic-gradient(var(--navy) 0 ${qPct}%, var(--gold) ${qPct}% ${qPct + aPct}%, var(--sage) ${qPct + aPct}% 100%)`;
    }
    if (legend) {
      legend.innerHTML = `
        <div class="lr"><span class="sw" style="background:var(--navy)"></span>Questions<span class="p">${questions}</span></div>
        <div class="lr"><span class="sw" style="background:var(--gold)"></span>Affairs<span class="p">${affairs}</span></div>
        <div class="lr"><span class="sw" style="background:var(--sage)"></span>Courses<span class="p">${courses}</span></div>`;
    }
  }

  function formatK(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(n);
  }

  async function loadQuestions(mode) {
    const viewId = mode === 'review' ? 'review' : 'questions';
    const tbody = document.querySelector(`#v-${viewId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = loadingHtml(5);

    const path =
      mode === 'review'
        ? '/admin/questions/review-queue?limit=50'
        : `/admin/questions?limit=50${questionsSearchTerm ? `&q=${encodeURIComponent(questionsSearchTerm)}` : ''}`;
    const data = await api(path);
    const items = data.items || [];

    if (items.length === 0) {
      tbody.innerHTML = emptyHtml(5, 'No questions', 'Import JSON/CSV or add questions via API.');
      return;
    }

    if (mode === 'review') {
      tbody.innerHTML = items
        .map((q) => {
          const qid = q.id || q._id;
          const issue = q.qualityIssues?.[0]?.message || q.reviewStatus || 'Review needed';
          const dup = q.duplicateOf?.id ? `#${String(q.duplicateOf.id).slice(-6)}` : '—';
          return `<tr>
            <td>${escapeHtml(truncate(q.text, 80))}</td>
            <td><span class="pill p-rev">${escapeHtml(issue)}</span></td>
            <td>${dup}</td>
            <td>${actions([
              btn('Re-check', '', `reviewQuestion('${qid}','fix')`),
              q.duplicateOf?.id
                ? btn('Merge', 'pri', `reviewQuestion('${qid}','merge','${q.duplicateOf.id}')`)
                : '',
              btn('Reject', 'no', `reviewQuestion('${qid}','reject')`),
            ])}</td>
          </tr>`;
        })
        .join('');
      return;
    }

    tbody.innerHTML = items
      .map((q) => {
        const qid = q.id || q._id;
        const nextStatus = q.status === 'published' ? 'draft' : 'published';
        const actionLabel = q.status === 'published' ? 'Unpublish' : 'Publish';
        return `<tr>
          <td>${escapeHtml(truncate(q.text, 80))}</td>
          <td>${escapeHtml(q.subject || '—')}</td>
          <td>${capitalize(q.difficulty || '—')}</td>
          <td>${pill(q.status)}</td>
          <td>${actions([
            btn(actionLabel, q.status === 'published' ? '' : 'pri', `setQuestionStatus('${qid}','${nextStatus}')`),
            btn('Delete', 'no', `deleteQuestion('${qid}')`),
          ])}</td>
        </tr>`;
      })
      .join('');
  }

  window.setQuestionStatus = async function (id, status) {
    await api(`/admin/questions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    toast(status === 'published' ? 'Published' : 'Unpublished');
    await loadQuestions('questions');
    await loadDashboard();
  };

  window.deleteQuestion = async function (id) {
    if (!confirm('Delete this question?')) return;
    await api(`/admin/questions/${id}`, { method: 'DELETE' });
    toast('Deleted');
    await loadQuestions('questions');
  };

  window.reviewQuestion = async function (id, action, mergeTargetId) {
    const body = { action };
    if (action === 'merge' && mergeTargetId) body.mergeTargetId = mergeTargetId;
    await api(`/admin/questions/${id}/review`, { method: 'POST', body: JSON.stringify(body) });
    toast('Review updated');
    await loadQuestions('review');
    await loadDashboard();
  };

  async function loadTests() {
    const tbody = document.querySelector('#v-tests tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    const data = await api('/admin/tests/pending?limit=50');
    const items = data.items || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No pending tests.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((t) => {
        const id = t.id || t._id;
        const name = t.createdBy?.name || 'Community';
        return `<tr>
          <td><div class="cellname"><div class="av av-gold">${initials(name)}</div><div>${escapeHtml(t.title || 'Untitled')}</div></div></td>
          <td>${escapeHtml(t.subject || 'General')}</td>
          <td>—</td>
          <td>${pill('pending')}</td>
          <td>${actions([
            btn('Approve', 'ok', `reviewTest('${id}','approve')`),
            btn('Reject', 'no', `reviewTest('${id}','reject')`),
          ])}</td>
        </tr>`;
      })
      .join('');
  }

  window.reviewTest = async function (id, decision) {
    await api(`/admin/tests/${id}/review`, { method: 'POST', body: JSON.stringify({ decision }) });
    toast(decision === 'approve' ? 'Approved & published' : 'Rejected');
    await loadTests();
    await loadDashboard();
  };

  async function loadExams() {
    const tbody = document.querySelector('#v-exams tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    const data = await api('/admin/exams?limit=50');
    renderStatusTable(tbody, data.items || [], {
      name: (e) => e.name,
      cols: [(e) => e.category || '—', () => '—'],
      type: 'exam',
    });
  }

  async function loadCourses() {
    const tbody = document.querySelector('#v-courses tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    const data = await api('/admin/courses?limit=50');
    renderStatusTable(tbody, data.items || [], {
      name: (c) => c.title,
      cols: [(c) => String((c.lessons || []).length), () => '—'],
      type: 'course',
    });
  }

  async function loadAffairs() {
    const tbody = document.querySelector('#v-affairs tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    const data = await api('/admin/current-affairs?limit=50');
    renderStatusTable(tbody, data.items || [], {
      name: (a) => a.title || a.headline,
      cols: [(a) => a.category || '—', (a) => formatDate(a.publishedAt || a.createdAt)],
      type: 'affair',
    });
  }

  async function loadMentors() {
    const tbody = document.querySelector('#v-mentors tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    const data = await api('/admin/mentors?limit=50');
    const items = data.items || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No mentors yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((m) => {
        const id = m.id || m._id;
        const user = m.userId || {};
        const name = user.name || 'Mentor';
        const expertise = (m.expertise || []).join(', ') || '—';
        return `<tr>
          <td><div class="cellname"><div class="av av-navy">${initials(name)}</div><div>${escapeHtml(name)}</div></div></td>
          <td>${escapeHtml(expertise)}</td>
          <td>${m.rating != null ? `${m.rating}★` : '—'}</td>
          <td>${m.sessionsCount ?? '—'}</td>
          <td>${pill('active')}</td>
          <td>${actions([btn('Delete', 'no', `deleteMentor('${id}')`)])}</td>
        </tr>`;
      })
      .join('');
  }

  window.deleteMentor = async function (id) {
    if (!confirm('Remove this mentor?')) return;
    await api(`/admin/mentors/${id}`, { method: 'DELETE' });
    toast('Mentor removed');
    await loadMentors();
  };

  function renderStatusTable(tbody, items, { name, cols, type }) {
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No items found.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((item) => {
        const id = item.id || item._id;
        const status = item.status || 'draft';
        const next = status === 'published' ? 'draft' : 'published';
        const label = status === 'published' ? 'Unpublish' : 'Publish';
        const colCells = cols.map((fn) => `<td>${escapeHtml(String(fn(item) ?? '—'))}</td>`).join('');
        return `<tr>
          <td>${escapeHtml(name(item) || 'Untitled')}</td>
          ${colCells}
          <td>${pill(status)}</td>
          <td>${actions([
            btn(label, status === 'published' ? '' : 'pri', `setContentStatus('${type}','${id}','${next}')`),
            btn('Delete', 'no', `deleteContent('${type}','${id}')`),
          ])}</td>
        </tr>`;
      })
      .join('');
  }

  window.setContentStatus = async function (type, id, status) {
    const paths = {
      exam: `/admin/exams/${id}/status`,
      course: `/admin/courses/${id}/status`,
      affair: `/admin/current-affairs/${id}/status`,
    };
    await api(paths[type], { method: 'PATCH', body: JSON.stringify({ status }) });
    toast(status === 'published' ? 'Published' : 'Unpublished');
    if (type === 'exam') await loadExams();
    if (type === 'course') await loadCourses();
    if (type === 'affair') await loadAffairs();
    await loadDashboard();
  };

  window.deleteContent = async function (type, id) {
    if (!confirm('Delete this item?')) return;
    const paths = { exam: `/admin/exams/${id}`, course: `/admin/courses/${id}`, affair: `/admin/current-affairs/${id}` };
    await api(paths[type], { method: 'DELETE' });
    toast('Deleted');
    if (type === 'exam') await loadExams();
    if (type === 'course') await loadCourses();
    if (type === 'affair') await loadAffairs();
  };

  async function loadAiFeedback() {
    const tbody = document.querySelector('#v-aifeedback tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4">Loading…</td></tr>`;
    const data = await api('/admin/ai-feedback?limit=50');
    const items = data.items || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No flagged AI feedback.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((f) => {
        const id = f.id || f._id;
        return `<tr>
          <td>${escapeHtml(truncate(f.questionText || f.prompt || 'Answer review', 60))}</td>
          <td>${escapeHtml(f.userName || f.userId || 'Student')}</td>
          <td><span class="pill p-rev">${escapeHtml(f.reason || f.status || 'Flagged')}</span></td>
          <td>${actions([
            btn('Keep grade', 'ok', `reviewAi('${id}','keep')`),
            btn('Override', 'no', `reviewAi('${id}','override')`),
          ])}</td>
        </tr>`;
      })
      .join('');
  }

  window.reviewAi = async function (id, decision) {
    await api(`/admin/ai-feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action: decision === 'keep' ? 'keep' : 'override',
        ...(decision === 'override' ? { grade: 0, note: 'Adjusted by admin' } : {}),
      }),
    });
    toast(decision === 'keep' ? 'AI grade kept' : 'Grade overridden');
    await loadAiFeedback();
  };

  async function loadJobs() {
    const tbody = document.querySelector('#v-jobs tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    const data = await api('/admin/jobs');
    const jobs = data.items || [];
    if (jobs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No scheduled jobs.</td></tr>`;
      return;
    }
    tbody.innerHTML = jobs
      .map((job) => {
        const name = job.name;
        const last = job.lastRun;
        return `<tr>
          <td>${escapeHtml(job.description || name)}</td>
          <td>${escapeHtml(job.schedule || job.defaultSchedule || '—')}</td>
          <td>${escapeHtml(last?.startedAt ? formatDate(last.startedAt) : '—')}</td>
          <td>${pill(last?.status === 'completed' || last?.status === 'success' ? 'published' : last?.status === 'failed' ? 'rejected' : last?.status || 'draft')}</td>
          <td>${actions([btn('Run now', 'pri', `runJob('${name}')`)])}</td>
        </tr>`;
      })
      .join('');
  }

  window.runJob = async function (jobName) {
    const result = await api(`/admin/jobs/${encodeURIComponent(jobName)}/run`, {
      method: 'POST',
      body: JSON.stringify({ force: true }),
    });
    toast(result.queued ? 'Job queued' : 'Job triggered');
    await loadJobs();
  };

  async function loadStudents() {
    const tbody = document.querySelector('#v-students tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
    const data = await api(
      `/admin/students?limit=50${studentsSearchTerm ? `&q=${encodeURIComponent(studentsSearchTerm)}` : ''}`,
    );
    const items = data.items || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No students found.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((s) => {
        const sub = s.email || s.phone || '—';
        const accuracy = s.accuracy != null ? `${s.accuracy}%` : '—';
        return `<tr>
          <td><div class="cellname"><div class="av av-gold">${initials(s.name)}</div><div><div>${escapeHtml(s.name)}</div><div class="sub">${escapeHtml(sub)}</div></div></div></td>
          <td>${escapeHtml(s.targetExam || '—')}</td>
          <td>${s.attempts ?? 0}</td>
          <td>${accuracy}</td>
          <td>${s.streak ?? 0}</td>
          <td>${actions([
            btn('View', '', `viewStudent('${s.id}')`),
            s.isPremium ? btn('Pro', 'ok', `toast('Pro member')`) : '',
          ])}</td>
        </tr>`;
      })
      .join('');
  }

  window.viewStudent = async function (id) {
    const student = await api(`/admin/students/${id}`);
    if (!student) {
      toast('Student not found');
      return;
    }
    openModal({
      title: student.name,
      bodyHtml: `<div class="detail-grid">
        ${detailItem('Email', student.email || '—')}
        ${detailItem('Phone', student.phone || '—')}
        ${detailItem('Target exam', student.targetExam || '—')}
        ${detailItem('Attempts', student.attempts ?? 0)}
        ${detailItem('Accuracy', student.accuracy != null ? `${student.accuracy}%` : '—')}
        ${detailItem('Streak', student.streak ?? 0)}
        ${detailItem('Coins', student.coins ?? 0)}
        ${detailItem('Level', student.level ?? 1)}
        ${detailItem('Pro member', student.isPremium ? 'Yes' : 'No')}
        ${detailItem('Joined', formatDate(student.joinedAt))}
        ${detailItem('Last attempt', student.lastAttemptAt ? formatDate(student.lastAttemptAt) : '—')}
      </div>`,
      footerHtml: `<button type="button" class="tbtn gold" id="modalCancel">Close</button>`,
    });
    document.getElementById('modalCancel')?.addEventListener('click', closeModal);
  };

  function detailItem(label, value) {
    return `<div class="item"><label>${escapeHtml(label)}</label><span>${escapeHtml(String(value))}</span></div>`;
  }

  async function loadLive() {
    const data = await api('/admin/live-classes?limit=50');
    const items = data.items || [];
    const summary = data.summary || {};

    document.querySelectorAll('#v-live .metrics .v').forEach((el, index) => {
      const values = [
        summary.liveCount ?? 0,
        summary.scheduledCount ?? 0,
        summary.watchingNow ?? 0,
        summary.recordingCount ?? 0,
      ];
      el.textContent = String(values[index] ?? 0);
    });

    const liveNow = items.find((item) => item.status === 'live') ?? null;
    activeLiveClassId = liveNow?.id ?? null;

    const vwrs = document.getElementById('vwrs');
    const pcount = document.getElementById('pcount');
    if (vwrs) vwrs.textContent = String(liveNow?.viewers ?? 0);
    if (pcount) pcount.textContent = String(liveNow?.viewers ?? 0);

    const eduName = document.querySelector('#s-live-room .edu .en');
    const eduTitle = document.querySelector('#s-live-room .edu .et');
    const eduFav = document.querySelector('#s-live-room .edu .fav');
    if (liveNow) {
      if (eduName) eduName.textContent = liveNow.instructor || 'Instructor';
      if (eduTitle) eduTitle.textContent = liveNow.title || 'Live class';
      if (eduFav) eduFav.textContent = initials(liveNow.instructor || 'LC');
    } else if (eduTitle) {
      eduTitle.textContent = 'No live class right now';
      if (eduName) eduName.textContent = '—';
      if (eduFav) eduFav.textContent = '—';
    }

    const chatBody = document.getElementById('chatBody');
    if (chatBody && !liveNow) {
      chatBody.innerHTML = `<div class="empty-card" style="margin:8px 0"><b>No live chat</b>Start or join a live class to see messages here.</div>`;
    } else if (chatBody && liveNow && chatBody.children.length === 0) {
      chatBody.innerHTML = `<div class="msg"><div class="ma av-gold">LC</div><div class="mb"><b>Live</b><p>${escapeHtml(liveNow.title)} is streaming.</p></div></div>`;
    }

    const upcoming = items.filter((item) => item.status === 'scheduled' || item.status === 'live');
    const upcomingTbody = document.querySelector('#s-live-up tbody');
    if (upcomingTbody) {
      if (upcoming.length === 0) {
        upcomingTbody.innerHTML = `<tr><td colspan="5">No upcoming classes.</td></tr>`;
      } else {
        upcomingTbody.innerHTML = upcoming
          .map((item) => {
            const when =
              item.status === 'live' ? 'Now' : formatDateTime(item.scheduledAt);
            const openBtn =
              item.status === 'live'
                ? btn('Open room', 'pri', `subShow('live','live-room')`)
                : btn('Go live', 'pri', `startLiveClass('${item.id}')`);
            return `<tr>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.instructor || '—')}</td>
              <td>${when}</td>
              <td>${pill(item.status)}</td>
              <td>${actions([
                openBtn,
                item.status === 'scheduled'
                  ? btn('Cancel', 'no', `endLiveClass('${item.id}')`)
                  : btn('End', 'no', `endLiveClass('${item.id}')`),
              ])}</td>
            </tr>`;
          })
          .join('');
      }
    }

    const recordings = items.filter(
      (item) => item.status === 'ended' && item.recordingUrl,
    );
    const recTbody = document.querySelector('#s-live-rec tbody');
    if (recTbody) {
      if (recordings.length === 0) {
        recTbody.innerHTML = `<tr><td colspan="6">No recordings yet.</td></tr>`;
      } else {
        recTbody.innerHTML = recordings
          .map((item) => {
            const duration = item.durationMin ? `${item.durationMin} min` : '—';
            return `<tr>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.instructor || '—')}</td>
              <td>${duration}</td>
              <td>${item.viewers ?? 0}</td>
              <td>${pill('published')}</td>
              <td>${actions([
                item.recordingUrl
                  ? btn('Open', 'pri', `openRecording('${String(item.recordingUrl).replace(/'/g, "\\'")}')`)
                  : '',
              ])}</td>
            </tr>`;
          })
          .join('');
      }
    }
  }

  window.startLiveClass = async function (id) {
    await api(`/admin/live-classes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'live' }),
    });
    toast('Class is now live');
    await loadLive();
    subShow('live', 'live-room');
  };

  window.endLiveClass = async function (id) {
    if (!confirm('End or cancel this class?')) return;
    await api(`/admin/live-classes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ended' }),
    });
    toast('Class ended');
    await loadLive();
  };

  window.scheduleLiveClass = async function () {
    const title = document.getElementById('liveSchedTitle')?.value?.trim();
    const instructor = document.getElementById('liveSchedInstructor')?.value?.trim();
    const examTag = document.getElementById('liveSchedExamTag')?.value?.trim() || 'SSC';
    const whenRaw = document.getElementById('liveSchedDateTime')?.value;
    const durationMin = Number(document.getElementById('liveSchedDuration')?.value || 60);
    if (!title || !whenRaw) {
      toast('Title and date/time are required');
      return;
    }
    const scheduledAt = new Date(whenRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast('Invalid date/time');
      return;
    }
    await api('/admin/live-classes', {
      method: 'POST',
      body: JSON.stringify({
        title,
        instructor,
        examTag,
        scheduledAt: scheduledAt.toISOString(),
        durationMin,
        status: 'scheduled',
      }),
    });
    toast('Live class scheduled');
    await loadLive();
    subShow('live', 'live-up');
  };

  async function loadPush() {
    const stats = statsCache || (await api('/admin/stats'));
    const audienceSelect = document.getElementById('pnAudience');
    if (audienceSelect) {
      audienceSelect.innerHTML = `
        <option value="all">All students (${stats.totalStudents ?? 0})</option>
        <option value="active">Active (30d) — ${stats.activeStudents ?? 0}</option>
        <option value="pro">Pro members</option>
        <option value="free">Free tier</option>`;
    }
    const recent = await api('/admin/notifications/recent?limit=5');
    const tbody = document.querySelector('#v-push table tbody');
    if (!tbody) return;
    const items = recent.items || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3">No notifications sent yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.title)}</td>
          <td>${formatDate(row.sentAt)}</td>
          <td>${row.pushSent ? 'Push sent' : 'In-app only'}</td>
        </tr>`,
      )
      .join('');
  }

  window.sendPushNotification = async function () {
    const title = document.getElementById('pnTitle')?.value?.trim();
    const body = document.getElementById('pnBody')?.value?.trim();
    const audience = document.getElementById('pnAudience')?.value || 'all';
    if (!title || !body) {
      toast('Title and message are required');
      return;
    }
    const result = await api('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, body, audience }),
    });
    toast(`Sent to ${result.targeted ?? result.inApp ?? 0} students`);
    await loadPush();
  };

  async function loadAnnounce() {
    const recent = await api('/admin/notifications/recent?limit=10');
    const tbody = document.querySelector('#v-announce table tbody');
    if (!tbody) return;
    const banners = (recent.items || []).filter((row) => row.type === 'admin_announcement');
    if (banners.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No banners published yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = banners
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.body || row.title)}</td>
          <td>App home</td>
          <td>${pill('published')}</td>
          <td>${actions([btn('Sent', '', `toast('Published ${formatDate(row.sentAt)}')`)])}</td>
        </tr>`,
      )
      .join('');
  }

  window.publishAnnouncement = async function () {
    const message = document.getElementById('bnMsg')?.value?.trim();
    if (!message) {
      toast('Banner message is required');
      return;
    }
    const result = await api('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ message, link: 'Premium' }),
    });
    toast(`Banner published to ${result.targeted ?? result.inApp ?? 0} students`);
    await loadAnnounce();
  };

  async function loadCoupons() {
    const [referrals, plans] = await Promise.all([
      api('/admin/referrals'),
      api('/admin/billing-plans'),
    ]);

    const grid = document.getElementById('couponGrid');
    const tbody = document.querySelector('#v-coupons table tbody');
    const summary = referrals.summary || {};

    if (grid) {
      grid.innerHTML = (plans.plans || [])
        .map(
          (plan) => `<div class="panel" style="padding:16px">
            <b style="font-size:14px">${escapeHtml(plan.label)} plan</b>
            <div style="font-size:22px;font-family:'Space Grotesk',sans-serif;font-weight:700;margin:8px 0">${escapeHtml(plan.displayAmount)}</div>
            <div style="font-size:12px;color:var(--muted)">${escapeHtml(plan.description || '')}</div>
            <div style="font-size:11px;color:var(--faint);margin-top:8px">Server-side pricing · Razorpay checkout</div>
          </div>`,
        )
        .join('');
    }

    if (tbody) {
      const items = referrals.items || [];
      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No referral activity yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = items
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.referrerName)}</td>
            <td>${escapeHtml(row.referralCode || '—')}</td>
            <td>${pill(row.status)}</td>
            <td>${row.rewardCoins ?? 0} coins</td>
            <td>${formatDate(row.createdAt)}</td>
          </tr>`,
        )
        .join('');
    }

    const metrics = document.querySelectorAll('#v-coupons .metrics .v');
    if (metrics[0]) metrics[0].textContent = String(summary.total ?? 0);
    if (metrics[1]) metrics[1].textContent = String(summary.converted ?? 0);
    if (metrics[2]) metrics[2].textContent = String(summary.pending ?? 0);
  }

  window.createCoupon = function () {
    openModal({
      title: 'Referral & billing',
      bodyHtml: `<p class="empty-note" style="margin:0">Student referral rewards are tracked automatically. Pro plan prices are set in server env (<code>PREMIUM_MONTHLY_AMOUNT_PAISE</code>, <code>PREMIUM_YEARLY_AMOUNT_PAISE</code>). Create Razorpay offers in the Razorpay dashboard for promo codes.</p>`,
      footerHtml: `<button type="button" class="tbtn gold" id="modalCancel">Got it</button>`,
    });
    document.getElementById('modalCancel')?.addEventListener('click', closeModal);
  };

  window.inviteTeamMember = function () {
    openModal({
      title: 'Add admin team member',
      bodyHtml: `<div class="form" style="grid-template-columns:1fr">
        ${formField('inviteEmail', 'Email address', 'type="email" placeholder="admin@company.com"')}
        <p class="empty-note" style="margin:0">New admins are provisioned via server config. Run <code>npm run ensure-admin</code> in the server folder with <code>SEED_ADMIN_EMAIL</code> and <code>SEED_ADMIN_PASSWORD</code> in <code>.env</code>.</p>
      </div>`,
      footerHtml: `<button type="button" class="tbtn ghost" id="modalCancel">Close</button>
        <button type="button" class="tbtn gold" id="modalInviteCopy">Copy setup steps</button>`,
    });
    document.getElementById('modalCancel')?.addEventListener('click', closeModal);
    document.getElementById('modalInviteCopy')?.addEventListener('click', () => {
      const email = document.getElementById('inviteEmail')?.value?.trim();
      const steps = `1. Set SEED_ADMIN_EMAIL=${email || 'admin@example.com'} in server/.env\n2. Set SEED_ADMIN_PASSWORD\n3. Run: cd server && npm run ensure-admin`;
      void navigator.clipboard.writeText(steps).then(() => toast('Setup steps copied'));
    });
  };

  async function loadRevenue() {
    const [summary, payments] = await Promise.all([
      api('/admin/revenue'),
      api('/admin/payments?limit=25'),
    ]);

    const metrics = document.querySelectorAll('#v-revenue .metrics .v');
    if (metrics[0]) {
      metrics[0].innerHTML = `₹<span class="num">${Math.round((summary.mrrPaise ?? 0) / 100).toLocaleString()}</span>`;
    }
    if (metrics[1]) metrics[1].textContent = String(summary.activeSubscriptions ?? 0);
    if (metrics[2]) {
      metrics[2].innerHTML = `₹<span class="num">${Math.round((summary.arpuPaise ?? 0) / 100).toLocaleString()}</span>`;
    }
    if (metrics[3]) metrics[3].textContent = String(summary.refunds30d ?? 0);

    const tbody = document.querySelector('#v-revenue table tbody');
    if (!tbody) return;
    const items = payments.items || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No payment transactions yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((row) => {
        const amount = `₹${Math.round(row.amountPaise / 100).toLocaleString()}`;
        const planLabel = row.plan === 'yearly' ? 'Pro · Yearly' : 'Pro · Monthly';
        const statusPill =
          row.status === 'paid' ? 'published' : row.status === 'refunded' ? 'rejected' : 'pending';
        return `<tr>
          <td><div class="cellname"><div class="av av-gold">${initials(row.studentName)}</div><div>${escapeHtml(row.studentName)}</div></div></td>
          <td>${planLabel}</td>
          <td>${amount}</td>
          <td>${row.paymentId ? 'UPI/Card' : '—'}</td>
          <td>${pill(statusPill === 'published' ? 'paid' : statusPill)}</td>
          <td>${actions([btn('View', '', `toast('Order ${row.id.slice(-6)}')`)])}</td>
        </tr>`;
      })
      .join('');
  }

  async function loadMedia() {
    const panel = document.querySelector('#v-media');
    if (!panel) return;
    const staticGrid = panel.querySelector('.cgrid');
    if (staticGrid) staticGrid.remove();
    let grid = panel.querySelector('.media-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'media-grid';
      panel.appendChild(grid);
    }
    grid.innerHTML = '<p class="empty-note">Loading media…</p>';
    const data = await api('/admin/media?limit=30');
    const items = data.items || [];
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-card"><b>No media yet</b>Add lessons with video URLs in Courses.</div>`;
      return;
    }
    grid.innerHTML = items
      .map(
        (item) => `<div class="media-card">
          <b>${escapeHtml(item.title)}</b>
          <div class="meta">${escapeHtml(item.subject || item.type)} · ${capitalize(item.status || 'draft')}</div>
          <div class="url">${escapeHtml(item.url || 'No video URL')}</div>
        </div>`,
      )
      .join('');
  }

  async function loadRoles() {
    const tbody = document.querySelector('#v-roles tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    const data = await api('/admin/team');
    const items = data.items || [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No team members found.</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((member) => {
        const isOwner = member.id === currentUser?.id;
        return `<tr>
          <td><div class="cellname"><div class="av av-gold">${initials(member.name)}</div><div>${escapeHtml(member.name)}</div></div></td>
          <td>${escapeHtml(member.email || '—')}</td>
          <td>${pill(member.role === 'admin' ? 'published' : 'pending')}</td>
          <td>${pill('active')}</td>
          <td>${actions([
            isOwner ? btn('You', '', `toast('Signed-in account')`) : btn('View', '', `toast('${member.role} account')`),
          ])}</td>
        </tr>`;
      })
      .join('');
  }

  async function loadSettings() {
    const [me, plans] = await Promise.all([
      currentUser ? Promise.resolve(currentUser) : api('/me'),
      api('/admin/billing-plans').catch(() => ({ plans: [] })),
    ]);

    const nameInput = document.getElementById('settingsName');
    const emailInput = document.getElementById('settingsEmail');
    const proPriceInput = document.getElementById('settingsProPrice');
    if (nameInput) nameInput.value = me?.name || '';
    if (emailInput) emailInput.value = me?.email || '';
    const monthly = (plans.plans || []).find((plan) => plan.id === 'monthly');
    if (proPriceInput) proPriceInput.value = monthly?.displayAmount?.replace('₹', '') || '299';
  }

  window.exportAdminReport = async function () {
    const [stats, reports, students, revenue] = await Promise.all([
      api('/admin/stats'),
      api('/admin/reports'),
      api('/admin/students?limit=200'),
      api('/admin/revenue'),
    ]);

    const lines = [
      'Sopaan Admin Report',
      `Generated,${reports.generatedAt || new Date().toISOString()}`,
      '',
      'Metric,Value',
      `Active students (30d),${stats.activeStudents ?? 0}`,
      `Total students,${stats.totalStudents ?? 0}`,
      `Pro members,${stats.proStudents ?? 0}`,
      `Mock attempts (30d),${stats.attemptsLast30Days ?? 0}`,
      `MRR (INR),${Math.round((stats.mrrPaise ?? 0) / 100)}`,
      `Revenue 30d (INR),${Math.round((stats.revenue30dPaise ?? 0) / 100)}`,
      `Referrals,${stats.referralsTotal ?? 0}`,
      '',
      'Student,Name,Email,Attempts,Accuracy,Streak,Pro',
      ...(students.items || []).map(
        (row) =>
          `Student,${csvCell(row.name)},${csvCell(row.email || '')},${row.attempts ?? 0},${row.accuracy ?? ''},${row.streak ?? 0},${row.isPremium ? 'yes' : 'no'}`,
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sopaan-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast('Report downloaded');
  };

  function csvCell(value) {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
  }

  window.saveSettings = function () {
    toast('Profile is managed via auth. Pricing is configured in server environment variables.');
  };

  window.importQuestions = function () {
    const input = document.getElementById('importQuestionsFile');
    if (input) {
      input.click();
      return;
    }
    toast('Import file picker not available');
  };

  async function handleQuestionImport(file) {
    const form = new FormData();
    form.append('file', file);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API}/admin/questions/import`, {
      method: 'POST',
      headers,
      body: form,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) throw new Error(apiMessage(data, 'Import failed'));
    toast(`Imported ${data.insertedCount ?? data.imported ?? 0} questions`);
    await loadQuestions('questions');
    await loadDashboard();
  }

  window.createExam = function () {
    openModal({
      title: 'Add exam',
      bodyHtml: `<div class="form" style="grid-template-columns:1fr">
        ${formField('examName', 'Exam name', 'placeholder="SSC CGL"')}
        ${formField('examCode', 'Exam code', 'placeholder="SSC-CGL"')}
        ${formSelect('examCategory', 'Category', [
          { value: 'SSC', label: 'SSC' },
          { value: 'Banking', label: 'Banking' },
          { value: 'Railways', label: 'Railways' },
          { value: 'UPSC', label: 'UPSC' },
          { value: 'StatePSC', label: 'State PSC' },
          { value: 'Police', label: 'Police' },
          { value: 'Defence', label: 'Defence' },
          { value: 'Teaching', label: 'Teaching' },
          { value: 'Other', label: 'Other' },
        ])}
      </div>`,
      onSubmit: async () => {
        const name = document.getElementById('examName')?.value?.trim();
        const code = document.getElementById('examCode')?.value?.trim();
        const category = document.getElementById('examCategory')?.value || 'SSC';
        if (!name || !code) throw new Error('Name and code are required');
        await api('/admin/exams', {
          method: 'POST',
          body: JSON.stringify({ name, code, category, status: 'draft' }),
        });
        closeModal();
        toast('Exam created');
        show('exams');
      },
    });
  };

  window.createCourse = function () {
    openModal({
      title: 'Add course',
      bodyHtml: `<div class="form" style="grid-template-columns:1fr">
        ${formField('courseTitle', 'Course title', 'placeholder="Quant Foundation"')}
        ${formField('courseSubject', 'Subject', 'placeholder="Quant" value="Quant"')}
      </div>`,
      onSubmit: async () => {
        const title = document.getElementById('courseTitle')?.value?.trim();
        const subject = document.getElementById('courseSubject')?.value?.trim() || 'General';
        if (!title) throw new Error('Title is required');
        await api('/admin/courses', {
          method: 'POST',
          body: JSON.stringify({ title, subject, isFree: true, status: 'draft' }),
        });
        closeModal();
        toast('Course created');
        show('courses');
      },
    });
  };

  window.createAffair = function () {
    openModal({
      title: 'Add current affairs article',
      bodyHtml: `<div class="form" style="grid-template-columns:1fr">
        ${formField('affairTitle', 'Headline', 'placeholder="New scheme announced"')}
        ${formField('affairCategory', 'Category', 'placeholder="Schemes" value="General"')}
      </div>`,
      onSubmit: async () => {
        const title = document.getElementById('affairTitle')?.value?.trim();
        const category = document.getElementById('affairCategory')?.value?.trim() || 'General';
        if (!title) throw new Error('Headline is required');
        await api('/admin/current-affairs', {
          method: 'POST',
          body: JSON.stringify({
            title,
            category,
            publishedAt: new Date().toISOString(),
            status: 'draft',
          }),
        });
        closeModal();
        toast('Article created');
        show('affairs');
      },
    });
  };

  window.createMentor = async function () {
    const students = await api('/admin/students?limit=50');
    const options = (students.items || []).map((s) => ({
      value: s.id,
      label: `${s.name}${s.email ? ` (${s.email})` : ''}`,
    }));
    if (options.length === 0) {
      toast('No students found to link as mentor');
      return;
    }
    openModal({
      title: 'Add mentor',
      bodyHtml: `<div class="form" style="grid-template-columns:1fr">
        ${formSelect('mentorUserId', 'Student account', options)}
        ${formField('mentorExpertise', 'Expertise (comma-separated)', 'placeholder="Quant, Reasoning" value="Quant"')}
        ${formField('mentorBio', 'Bio (optional)', 'placeholder="10+ years teaching experience"')}
      </div>`,
      onSubmit: async () => {
        const userId = document.getElementById('mentorUserId')?.value;
        const expertiseRaw = document.getElementById('mentorExpertise')?.value || 'Quant';
        const bio = document.getElementById('mentorBio')?.value?.trim();
        const expertise = expertiseRaw.split(',').map((s) => s.trim()).filter(Boolean);
        if (!userId) throw new Error('Select a student account');
        await api('/admin/mentors', {
          method: 'POST',
          body: JSON.stringify({ userId, expertise, ...(bio ? { bio } : {}) }),
        });
        closeModal();
        toast('Mentor created');
        await loadMentors();
      },
    });
  };

  window.openGenerateExamModal = function () {
    openModal({
      title: 'Generate exam with AI',
      bodyHtml: `<div class="form" style="grid-template-columns:1fr">
        ${formField('genTitle', 'Exam title', 'value="SSC CGL Full Mock"')}
        ${formField('genTag', 'Exam tag', 'value="SSC"')}
        ${formSelect('genDifficulty', 'Difficulty', [
          { value: 'easy', label: 'Easy' },
          { value: 'medium', label: 'Medium' },
          { value: 'hard', label: 'Hard' },
        ])}
        ${formField('genCount', 'Questions per section', 'type="number" min="5" max="25" value="10"')}
      </div>`,
      onSubmit: async () => {
        const title = document.getElementById('genTitle')?.value?.trim();
        const examTag = document.getElementById('genTag')?.value?.trim() || 'SSC';
        const difficulty = document.getElementById('genDifficulty')?.value || 'medium';
        const count = Number(document.getElementById('genCount')?.value || 10);
        if (!title) throw new Error('Title is required');
        closeModal();
        toast('Generating exam with AI…');
        const result = await api('/admin/generate-exam', {
          method: 'POST',
          body: JSON.stringify({
            title,
            examTag,
            language: 'en',
            difficulty,
            publish: false,
            sections: [{ subject: 'Quant', topic: 'Mixed', difficulty, count }],
          }),
        });
        toast(`Exam queued: ${result.title || title}`);
        show('tests');
      },
    });
  };

  window.subShow = function (view, sub) {
    show(view);
    const map = {
      'live-room': 's-live-room',
      'live-sched': 's-live-sched',
      'live-up': 's-live-up',
      'live-rec': 's-live-rec',
    };
    const targetId = map[sub] || `s-${sub}`;
    document.querySelectorAll(`#v-${view} .subview`).forEach((el) => el.classList.remove('active'));
    const panel = document.getElementById(targetId);
    if (panel) panel.classList.add('active');
    document.querySelectorAll(`#v-${view} .subtabs .st`).forEach((tab) => {
      tab.classList.toggle('on', tab.dataset.sub === sub);
    });
  };

  window.syncPush = function () {
    const title = document.getElementById('pnTitle')?.value || '';
    const body = document.getElementById('pnBody')?.value || '';
    const ppTitle = document.getElementById('ppTitle');
    const ppBody = document.getElementById('ppBody');
    if (ppTitle) ppTitle.textContent = title;
    if (ppBody) ppBody.textContent = body;
  };

  window.sendMsg = function () {
    const input = document.getElementById('chatInput');
    const body = document.getElementById('chatBody');
    if (!input || !body || !input.value.trim()) return;
    const msg = document.createElement('div');
    msg.className = 'msg';
    msg.innerHTML = `<div class="ma av-gold">AD</div><div class="mb"><b>Admin</b><p>${escapeHtml(input.value.trim())}</p></div>`;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
    input.value = '';
    toast('Message posted to room preview');
  };

  function formatDateTime(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  window.openRecording = function (url) {
    if (url) window.open(url, '_blank');
  };

  function initToolbar() {
    document.getElementById('btnMenu')?.addEventListener('click', openSidebar);
    document.getElementById('sideOverlay')?.addEventListener('click', closeSidebar);
    document.getElementById('modalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'modalBackdrop') closeModal();
    });

    document.getElementById('btnAlerts')?.addEventListener('click', () => {
      const s = statsCache;
      if (!s) {
        show('review');
        return;
      }
      if ((s.pendingReviews ?? 0) > 0) show('tests');
      else if ((s.pendingQuestionReviews ?? 0) > 0) show('review');
      else if ((s.aiFeedbackPending ?? 0) > 0) show('aifeedback');
      else show('dashboard');
    });

    document.getElementById('globalSearch')?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = e.target.value.trim();
      if (!q) return;
      if (q.length >= 3 && !q.includes(' ')) {
        questionsSearchTerm = q;
        show('questions');
        return;
      }
      studentsSearchTerm = q;
      const studentsInput = document.getElementById('studentsSearch');
      if (studentsInput) studentsInput.value = q;
      show('students');
    });

    document.getElementById('btnImportQuestions')?.addEventListener('click', () => importQuestions());
    document.getElementById('importQuestionsFile')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) void handleQuestionImport(file).catch((err) => toast(err.message));
      e.target.value = '';
    });
    document.getElementById('btnGenerateExamTests')?.addEventListener('click', () => openGenerateExamModal());
    document.getElementById('btnAddExam')?.addEventListener('click', () => createExam());
    document.getElementById('btnAddCourse')?.addEventListener('click', () => createCourse());
    document.getElementById('btnAddAffair')?.addEventListener('click', () => createAffair());
    document.getElementById('btnAddMentor')?.addEventListener('click', () => {
      void createMentor().catch((err) => toast(err.message));
    });
    document.getElementById('btnScheduleLive')?.addEventListener('click', () => {
      void scheduleLiveClass().catch((err) => toast(err.message));
    });
    document.getElementById('btnSendPush')?.addEventListener('click', () => {
      void sendPushNotification().catch((err) => toast(err.message));
    });
    document.getElementById('btnPublishBanner')?.addEventListener('click', () => {
      void publishAnnouncement().catch((err) => toast(err.message));
    });
    document.getElementById('pnTitle')?.addEventListener('input', syncPush);
    document.getElementById('pnBody')?.addEventListener('input', syncPush);
    document.getElementById('bnMsg')?.addEventListener('input', (e) => {
      const prev = document.getElementById('bnPrev');
      if (prev) prev.textContent = e.target.value;
    });
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('btnSaveSettings')?.addEventListener('click', () => saveSettings());
    document.getElementById('btnUploadMedia')?.addEventListener('click', () => show('media'));
    document.getElementById('btnCreateCoupon')?.addEventListener('click', () => createCoupon());
    document.getElementById('btnExportReport')?.addEventListener('click', () => {
      void exportAdminReport().catch((err) => toast(err.message));
    });
    document.getElementById('btnInviteMember')?.addEventListener('click', () => inviteTeamMember());
    document.getElementById('btnSendChat')?.addEventListener('click', () => sendMsg());
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMsg();
    });
    document.querySelectorAll('.react-btn').forEach((btn) => {
      btn.addEventListener('click', () => toast(`${btn.dataset.emoji || '👍'} sent`));
    });
    ['ctrlMic', 'ctrlCam', 'ctrlShare', 'ctrlMute'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', () => toast('Streaming controls need LiveKit configured on server'));
    });
    document.getElementById('btnEndLive')?.addEventListener('click', () => {
      if (!activeLiveClassId) {
        toast('No active live class');
        return;
      }
      void endLiveClass(activeLiveClassId).catch((err) => toast(err.message));
    });

    document.getElementById('questionsSearch')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        questionsSearchTerm = e.target.value.trim();
        void loadQuestions('questions').catch((err) => toast(err.message));
      }
    });
    document.getElementById('studentsSearch')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        studentsSearchTerm = e.target.value.trim();
        void loadStudents().catch((err) => toast(err.message));
      }
    });

    document.querySelectorAll('#liveTabs .st').forEach((tab) => {
      tab.addEventListener('click', () => subShow('live', tab.dataset.sub));
    });
  }

  window.generateExam = openGenerateExamModal;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncate(s, n) {
    const t = String(s || '');
    return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } catch {
      return '—';
    }
  }

  document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginErr');
    const btn = document.getElementById('loginBtn');
    errEl.classList.remove('show');
    errEl.textContent = '';
    btn?.classList.add('loading');
    btn?.setAttribute('disabled', 'true');
    try {
      await login(email, password);
    } catch (err) {
      errEl.textContent = err.message || String(err);
      errEl.classList.add('show');
    } finally {
      btn?.classList.remove('loading');
      btn?.removeAttribute('disabled');
    }
  });

  document.getElementById('btnGenerateExam')?.addEventListener('click', () => openGenerateExamModal());

  document.querySelectorAll('#v-dashboard .go').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const goto = btn.getAttribute('data-goto');
      if (goto) show(goto);
    });
  });

  document.getElementById('loginEmail')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn')?.click();
  });

  document.getElementById('loginPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn')?.click();
  });

  document.getElementById('btnLogout')?.addEventListener('click', () => logout(true));

  initToolbar();

  window.logout = logout;

  window.addEventListener('load', async () => {
    void loadLoginHint();
    if (await restoreSession()) {
      enterConsole();
      return;
    }
    logout(false);
    document.getElementById('loginGate')?.classList.remove('hidden');
    document.getElementById('adminApp')?.classList.add('hidden');
  });
})();
