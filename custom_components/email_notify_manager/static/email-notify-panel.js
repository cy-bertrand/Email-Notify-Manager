/**
 * Email Notify Manager — Custom Panel
 * Panel combiné : onglet utilisateur + onglet admin (si admin HA)
 */

const VERSION = "3.1.0";

const DAYS = [
  { key:"mon", label:"Lun" }, { key:"tue", label:"Mar" }, { key:"wed", label:"Mer" },
  { key:"thu", label:"Jeu" }, { key:"fri", label:"Ven" },
  { key:"sat", label:"Sam" }, { key:"sun", label:"Dim" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
:host {
  display:block;
  background:var(--primary-background-color,#f5f5f5);
  min-height:100vh;
  font-family:var(--paper-font-body1_-_font-family,'Roboto',sans-serif);
}
/* ── Header ── */
.page-header {
  background:var(--app-header-background-color,#01696f);
  color:var(--app-header-text-color,#fff);
  padding:0 24px;
  display:flex;
  align-items:center;
  gap:0;
  box-shadow:0 2px 8px rgba(0,0,0,.18);
  position:sticky;top:0;z-index:100;
  min-height:56px;
}
.header-logo {
  display:flex;align-items:center;gap:10px;
  margin-right:auto;
  font-size:18px;font-weight:600;letter-spacing:.01em;
}
.header-logo svg { width:26px;height:26px;flex-shrink:0; }
.tab-bar {
  display:flex;height:100%;
}
.tab-btn {
  padding:0 20px;height:56px;
  background:none;border:none;
  color:rgba(255,255,255,.65);
  font-size:14px;font-weight:500;
  cursor:pointer;
  border-bottom:3px solid transparent;
  transition:all .2s;
  white-space:nowrap;
}
.tab-btn:hover { color:rgba(255,255,255,.9); }
.tab-btn.active { color:#fff; border-bottom-color:#fff; }
/* ── Content ── */
.content { max-width:860px;margin:0 auto;padding:24px 16px; }
/* ── Cards ── */
.card {
  background:var(--card-background-color,#fff);
  border-radius:12px;
  margin-bottom:16px;
  box-shadow:0 1px 6px rgba(0,0,0,.09);
  overflow:hidden;
  transition:box-shadow .2s;
}
.card:hover { box-shadow:0 3px 14px rgba(0,0,0,.13); }
/* ── Card header ── */
.card-header {
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 20px;cursor:pointer;user-select:none;
  border-bottom:1px solid transparent;transition:border-color .2s;
}
.card-header.expanded { border-bottom-color:var(--divider-color,#e0e0e0); }
.card-title-row { display:flex;align-items:center;gap:12px;flex:1;min-width:0; }
.dot {
  width:9px;height:9px;border-radius:50%;flex-shrink:0;
  background:var(--disabled-text-color,#bdbdbd);transition:background .3s;
}
.dot.on { background:#4caf50;box-shadow:0 0 6px rgba(76,175,80,.5); }
.dot.warn { background:#ff9800; }
.card-label { font-size:15px;font-weight:500;color:var(--primary-text-color,#212121);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.card-sub { font-size:12px;color:var(--secondary-text-color,#757575);margin-top:2px; }
.card-sub em { color:#ff9800; }
.chevron { width:18px;height:18px;color:var(--secondary-text-color,#757575);transition:transform .3s;flex-shrink:0; }
.chevron.open { transform:rotate(180deg); }
/* ── Card body ── */
.card-body {
  padding:0 20px;max-height:0;overflow:hidden;
  transition:max-height .4s ease,padding .3s;
}
.card-body.expanded { max-height:900px;padding:16px 20px 20px; }
/* ── Section title ── */
.sect { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--secondary-text-color,#757575);margin:16px 0 8px; }
.sect:first-child { margin-top:0; }
/* ── Toggle ── */
.toggle-row { display:flex;align-items:center;justify-content:space-between;padding:6px 0; }
.toggle-lbl { font-size:14px;font-weight:500;color:var(--primary-text-color,#212121); }
.toggle-sub { font-size:12px;color:var(--secondary-text-color,#757575); }
.toggle { position:relative;width:44px;height:24px;flex-shrink:0; }
.toggle input { opacity:0;width:0;height:0; }
.tslider {
  position:absolute;inset:0;
  background:var(--disabled-text-color,#bdbdbd);
  border-radius:24px;cursor:pointer;transition:background .3s;
}
.tslider::before {
  content:"";position:absolute;
  width:18px;height:18px;left:3px;top:3px;
  background:#fff;border-radius:50%;
  transition:transform .3s;box-shadow:0 1px 3px rgba(0,0,0,.3);
}
.toggle input:checked + .tslider { background:var(--primary-color,#01696f); }
.toggle input:checked + .tslider::before { transform:translateX(20px); }
/* ── Email chips ── */
.chips-wrap {
  display:flex;flex-wrap:wrap;gap:6px;min-height:38px;
  padding:7px 10px;
  border:1px solid var(--divider-color,#e0e0e0);border-radius:8px;
  background:var(--primary-background-color,#f5f5f5);
  cursor:text;align-items:center;
}
.chip {
  display:flex;align-items:center;gap:3px;
  background:var(--primary-color,#01696f);color:#fff;
  border-radius:16px;padding:3px 8px 3px 10px;font-size:12px;font-weight:500;
}
.chip-x {
  cursor:pointer;background:none;border:none;
  color:rgba(255,255,255,.8);font-size:15px;line-height:1;padding:0 0 0 3px;
}
.chip-x:hover { color:#fff; }
.chip-input {
  border:none;outline:none;background:transparent;
  font-size:13px;min-width:160px;flex:1;
  color:var(--primary-text-color,#212121);
}
/* ── Condition grid ── */
.cond-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
@media(max-width:520px){ .cond-grid { grid-template-columns:1fr; } }
.cond-box {
  background:var(--primary-background-color,#f8f8f8);
  border:1px solid var(--divider-color,#e0e0e0);
  border-radius:8px;padding:12px;
}
.cond-box label { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#757575);display:block;margin-bottom:8px; }
.ha-sel,.ha-inp {
  width:100%;padding:7px 10px;
  border:1px solid var(--divider-color,#e0e0e0);border-radius:6px;
  background:var(--card-background-color,#fff);
  font-size:13px;color:var(--primary-text-color,#212121);outline:none;
}
.ha-sel:focus,.ha-inp:focus { border-color:var(--primary-color,#01696f); }
.time-row { display:flex;gap:7px;align-items:center;margin-top:8px; }
.time-row span { font-size:11px;color:var(--secondary-text-color,#757575);flex-shrink:0; }
.days-row { display:flex;gap:5px;flex-wrap:wrap;margin-top:8px; }
.day-btn {
  padding:3px 8px;border:1px solid var(--divider-color,#e0e0e0);border-radius:14px;
  font-size:11px;font-weight:600;cursor:pointer;
  background:var(--card-background-color,#fff);color:var(--secondary-text-color,#757575);
  transition:all .2s;user-select:none;
}
.day-btn.on { background:var(--primary-color,#01696f);color:#fff;border-color:var(--primary-color,#01696f); }
/* ── Actions row ── */
.actions {
  display:flex;align-items:center;justify-content:flex-end;gap:8px;
  margin-top:14px;padding-top:14px;border-top:1px solid var(--divider-color,#e0e0e0);
}
.btn {
  padding:7px 18px;border-radius:8px;font-size:13px;font-weight:500;
  cursor:pointer;transition:all .2s;border:none;outline:none;
}
.btn-primary { background:var(--primary-color,#01696f);color:#fff;box-shadow:0 2px 6px rgba(1,105,111,.25); }
.btn-primary:hover { filter:brightness(1.08);transform:translateY(-1px); }
.btn-primary:active { transform:none; }
.btn-primary:disabled { opacity:.55;cursor:not-allowed;transform:none; }
.btn-ghost { background:transparent;color:var(--secondary-text-color,#757575);border:1px solid var(--divider-color,#e0e0e0); }
.btn-ghost:hover { background:var(--divider-color,#e0e0e0); }
.btn-danger { background:#fce4e4;color:#c62828;border:1px solid #ffcdd2; }
.btn-danger:hover { background:#ffcdd2; }
.saved-msg { font-size:12px;font-weight:500;color:#4caf50;opacity:0;transition:opacity .3s;margin-right:auto; }
.saved-msg.show { opacity:1; }
/* ── Admin table ── */
.admin-toolbar { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px; }
.admin-toolbar h2 { font-size:16px;font-weight:600;color:var(--primary-text-color,#212121);margin:0; }
.table-wrap { overflow-x:auto; }
table { width:100%;border-collapse:collapse;font-size:13px; }
th { text-align:left;padding:8px 12px;border-bottom:2px solid var(--divider-color,#e0e0e0);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#757575); }
td { padding:11px 12px;border-bottom:1px solid var(--divider-color,#e0e0e0);color:var(--primary-text-color,#212121); }
tr:last-child td { border-bottom:none; }
tr:hover td { background:var(--primary-background-color,#f5f5f5); }
.badge {
  display:inline-flex;align-items:center;
  background:var(--primary-color,#01696f);color:#fff;
  border-radius:12px;padding:2px 8px;font-size:11px;font-weight:600;
}
.badge.zero { background:var(--disabled-text-color,#bdbdbd); }
.aut-id-code { font-family:monospace;font-size:12px;background:var(--primary-background-color,#f0f0f0);padding:2px 6px;border-radius:4px; }
/* ── Modal ── */
.modal-overlay {
  position:fixed;inset:0;background:rgba(0,0,0,.45);
  display:flex;align-items:center;justify-content:center;
  z-index:9000;padding:16px;
  animation:fadeIn .15s ease;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.modal {
  background:var(--card-background-color,#fff);
  border-radius:14px;width:100%;max-width:500px;
  box-shadow:0 12px 40px rgba(0,0,0,.2);
  animation:slideUp .2s ease;
  overflow:hidden;
}
@keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }
.modal-header {
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;border-bottom:1px solid var(--divider-color,#e0e0e0);
}
.modal-title { font-size:16px;font-weight:600;color:var(--primary-text-color,#212121); }
.modal-close { background:none;border:none;cursor:pointer;color:var(--secondary-text-color,#757575);font-size:22px;line-height:1;padding:0 4px; }
.modal-body { padding:20px; }
.modal-footer {
  display:flex;justify-content:flex-end;gap:8px;
  padding:14px 20px;border-top:1px solid var(--divider-color,#e0e0e0);
}
.form-field { margin-bottom:14px; }
.form-label { font-size:12px;font-weight:600;color:var(--secondary-text-color,#757575);display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em; }
.form-help { font-size:11px;color:var(--secondary-text-color,#757575);margin-top:4px; }
.form-error { font-size:11px;color:#c62828;margin-top:4px; }
/* ── Tag input (allowed_users) ── */
.tag-input-wrap {
  display:flex;flex-wrap:wrap;gap:5px;min-height:36px;
  padding:6px 8px;
  border:1px solid var(--divider-color,#e0e0e0);border-radius:6px;
  background:var(--primary-background-color,#f5f5f5);
  cursor:text;align-items:center;
}
.user-tag {
  display:flex;align-items:center;gap:3px;
  background:rgba(1,105,111,.12);color:var(--primary-color,#01696f);
  border-radius:12px;padding:2px 8px 2px 10px;font-size:12px;font-weight:500;
}
.user-tag-x { cursor:pointer;background:none;border:none;color:var(--primary-color,#01696f);font-size:14px;padding:0 0 0 2px;line-height:1; }
.tag-input { border:none;outline:none;background:transparent;font-size:13px;min-width:120px;flex:1;color:var(--primary-text-color,#212121); }
/* ── Loading / Empty ── */
.loading { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 0;gap:14px;color:var(--secondary-text-color,#757575); }
.spinner { width:34px;height:34px;border:3px solid var(--divider-color,#e0e0e0);border-top-color:var(--primary-color,#01696f);border-radius:50%;animation:spin .8s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
.empty { text-align:center;padding:48px 24px;color:var(--secondary-text-color,#757575);font-size:14px; }
.empty svg { width:56px;height:56px;margin:0 auto 14px;color:var(--disabled-text-color,#bdbdbd); }
.intro { background:var(--card-background-color,#fff);border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:13px;line-height:1.6;color:var(--primary-text-color,#212121);border-left:4px solid var(--primary-color,#01696f);box-shadow:0 1px 4px rgba(0,0,0,.07); }
.error-box { background:#fff3f3;border:1px solid #ffcdd2;border-radius:8px;padding:12px 16px;color:#c62828;font-size:13px;margin-bottom:16px; }
.smtp-warn { background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 16px;color:#e65100;font-size:13px;margin-bottom:16px; }
/* ── Subscribers list ── */
.sub-list { font-size:12px;color:var(--secondary-text-color,#757575);margin-top:6px; }
.sub-row { display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--divider-color,#e0e0e0); }
.sub-row:last-child { border-bottom:none; }
.sub-uid { font-family:monospace;font-size:11px; }
.sub-emails { color:var(--primary-color,#01696f); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
class EmailNotifyPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode:"open" });
    this._hass     = null;
    this._tab      = "user";   // "user" | "admin"
    this._isAdmin  = false;

    // User tab state
    this._userAuts  = [];
    this._drafts    = {};
    this._saved     = {};
    this._saving    = {};
    this._expanded  = {};
    this._userLoading = true;
    this._userError   = null;

    // Admin tab state
    this._adminAuts    = [];
    this._adminLoading = true;
    this._zones = [];
    this._adminError   = null;
    this._smtpOk       = null;
    this._modal        = null;   // null | {mode:"create"|"edit", data:{}}
    this._modalErrors  = {};

    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const wasAdmin = this._isAdmin;
    this._isAdmin = hass.user?.is_admin || hass.user?.is_owner || false;
    if (first) {
      this._loadUser();
    }
    if (this._isAdmin && !wasAdmin) {
      this._loadAdmin();
      this._render();
    } else if (first) {
      this._render();
    }
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  async _loadUser() {
    this._userLoading = true;
    this._userError   = null;
    this._render();
    try {
      const r = await this._hass.connection.sendMessagePromise({ type:"enm/user/get_automations" });
      this._userAuts = r.automations || [];
      this._zones = r.zones || [];
      this._userAuts.forEach(a => {
        this._drafts[a.automation_id] = JSON.parse(JSON.stringify(a.prefs));
      });
    } catch(e) {
      this._userError = `Erreur: ${e.message || e}`;
    }
    this._userLoading = false;
    this._render();
  }

  async _loadAdmin() {
    this._adminLoading = true;
    this._zones = [];
    this._adminError   = null;
    this._render();
    try {
      const [auts, smtp] = await Promise.all([
        this._hass.connection.sendMessagePromise({ type:"enm/admin/get_automations" }),
        this._hass.connection.sendMessagePromise({ type:"enm/admin/get_smtp_config" }),
      ]);
      this._adminAuts = auts.automations || [];
      this._smtpOk    = smtp.configured;
    } catch(e) {
      this._adminError = `Erreur: ${e.message || e}`;
    }
    this._adminLoading = false;
    this._render();
  }

  // ── User actions ─────────────────────────────────────────────────────────────

  _toggleExpand(id) { this._expanded[id] = !this._expanded[id]; this._render(); }
  _toggleEnabled(id) { this._drafts[id].enabled = !this._drafts[id].enabled; this._render(); }

  _removeEmail(id, email) {
    this._drafts[id].emails = this._drafts[id].emails.filter(e => e !== email);
    this._render();
  }

  _toggleDay(id, day) {
    const days = this._drafts[id].conditions.days;
    const i = days.indexOf(day);
    i >= 0 ? days.splice(i, 1) : days.push(day);
    this._render();
  }

  _isDirty(id) {
    const orig = this._userAuts.find(a => a.automation_id === id);
    if(!orig) return false;
    return JSON.stringify(this._drafts[id]) !== JSON.stringify(orig.prefs);
  }

  async _save(id) {
    this._saving[id] = true; this._render();
    try {
      await this._hass.connection.sendMessagePromise({
        type:"enm/user/save_preferences", automation_id:id, prefs:this._drafts[id]
      });
      const a = this._userAuts.find(x => x.automation_id === id);
      if(a) a.prefs = JSON.parse(JSON.stringify(this._drafts[id]));
      this._saved[id] = true;
      setTimeout(() => { this._saved[id] = false; this._render(); }, 2500);
    } catch(e) { alert(`Erreur: ${e.message || e}`); }
    this._saving[id] = false; this._render();
  }

  _revert(id) {
    const a = this._userAuts.find(x => x.automation_id === id);
    if(a) { this._drafts[id] = JSON.parse(JSON.stringify(a.prefs)); this._render(); }
  }

  // ── Admin actions ────────────────────────────────────────────────────────────

  _openCreate() {
    this._modal = { mode:"create", data:{ automation_id:"", label:"", allowed_users:[] } };
    this._modalErrors = {};
    this._render();
  }

  _openEdit(aut) {
    this._modal = { mode:"edit", data: JSON.parse(JSON.stringify(aut)) };
    this._modalErrors = {};
    this._render();
  }

  _closeModal() { this._modal = null; this._render(); }

  async _saveModal() {
    const d = this._modal.data;
    const errs = {};
    if(!d.automation_id || !/^[a-z0-9_]{1,64}$/.test(d.automation_id))
      errs.automation_id = "Identifiant invalide (minuscules, chiffres, underscores, max 64)";
    if(!d.label || !d.label.trim())
      errs.label = "Le libellé est obligatoire";
    this._modalErrors = errs;
    if(Object.keys(errs).length) { this._render(); return; }

    try {
      await this._hass.connection.sendMessagePromise({
        type:"enm/admin/upsert_automation",
        automation_id: d.automation_id,
        label: d.label,
        allowed_users: d.allowed_users,
      });
      this._modal = null;
      await this._loadAdmin();
    } catch(e) { alert(`Erreur: ${e.message || e}`); }
  }

  async _deleteAutomation(autId) {
    if(!confirm(`Supprimer l'automation "${autId}" et toutes ses préférences ?`)) return;
    try {
      await this._hass.connection.sendMessagePromise({
        type:"enm/admin/delete_automation", automation_id:autId
      });
      await this._loadAdmin();
    } catch(e) { alert(`Erreur: ${e.message || e}`); }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  _render() {
    const r = this.shadowRoot;
    r.innerHTML = `
      <style>${CSS}</style>
      ${this._renderHeader()}
      <div class="content">
        ${this._tab === "user" ? this._renderUserTab() : this._renderAdminTab()}
      </div>
      ${this._modal ? this._renderModal() : ""}
    `;
    this._bind();
  }

  _renderHeader() {
    return `
      <div class="page-header">
        <div class="header-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m2 7 10 7 10-7"/>
          </svg>
          Notifications Email
        </div>
        <div class="tab-bar">
          <button class="tab-btn ${this._tab==="user"?"active":""}" data-tab="user">Mes préférences</button>
          ${this._isAdmin ? `<button class="tab-btn ${this._tab==="admin"?"active":""}" data-tab="admin">⚙ Administration</button>` : ""}
        </div>
      </div>
    `;
  }

  // ─────────────── USER TAB ───────────────────────────────────────────────────

  _renderUserTab() {
    if(this._userLoading) return `<div class="loading"><div class="spinner"></div><span>Chargement…</span></div>`;
    if(this._userError)   return `<div class="error-box">⚠️ ${this._userError}</div>`;
    if(!this._userAuts.length) return `
      <div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m2 7 10 7 10-7"/>
        </svg>
        <p>Aucune automation disponible pour votre compte.</p>
        <p style="font-size:12px;margin-top:6px">Un administrateur doit vous ajouter aux automations.</p>
      </div>`;

    return `
      <div class="intro">
        <strong>Gérez vos notifications email</strong> — Activez ou désactivez chaque automation,
        définissez vos adresses de réception et posez des conditions (localisation, horaire).
      </div>
      ${this._userAuts.map(a => this._renderUserCard(a)).join("")}
    `;
  }

  _renderUserCard(aut) {
    const id = aut.automation_id;
    const d  = this._drafts[id] || aut.prefs;
    const expanded = !!this._expanded[id];
    const dirty    = this._isDirty(id);
    const hasEmails = d.emails.length > 0;
    const isOn = d.enabled && hasEmails;

    const sub = d.enabled
      ? (hasEmails ? `Actif · ${d.emails.length} adresse${d.emails.length>1?"s":""}` : "Actif · <em>aucune adresse</em>")
      : "Désactivé";

    return `
      <div class="card">
        <div class="card-header ${expanded?"expanded":""}" data-toggle="${id}">
          <div class="card-title-row">
            <div class="dot ${isOn?"on":(!hasEmails&&d.enabled?"warn":"")}"></div>
            <div style="min-width:0">
              <div class="card-label">${aut.label}</div>
              <div class="card-sub">${sub}${dirty?" · <em>non sauvegardé</em>":""}</div>
            </div>
          </div>
          <svg class="chevron ${expanded?"open":""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="card-body ${expanded?"expanded":""}">
          <!-- Toggle -->
          <div class="toggle-row">
            <div>
              <div class="toggle-lbl">Activer les notifications</div>
              <div class="toggle-sub">Recevez des emails pour cette automation</div>
            </div>
            <label class="toggle">
              <input type="checkbox" data-a="toggle-enabled" data-id="${id}" ${d.enabled?"checked":""}>
              <span class="tslider"></span>
            </label>
          </div>

          <!-- Emails -->
          <div class="sect">Adresses email de destination</div>
          <div class="chips-wrap" data-chips="${id}">
            ${d.emails.map(e => `
              <div class="chip">${e}
                <button class="chip-x" data-a="rm-email" data-id="${id}" data-email="${e}">×</button>
              </div>`).join("")}
            <input class="chip-input" type="email" placeholder="Ajouter (Entrée pour valider)" data-email-input="${id}">
          </div>

          <!-- Conditions -->
          <div class="sect">Conditions d'envoi</div>
          <div class="cond-grid">
            <div class="cond-box">
              <label>📍 Localisation</label>
              <select class="ha-sel" data-a="loc-filter" data-id="${id}">
                <option value="always" ${d.conditions.location_filter==="always"?"selected":""}>Toujours</option>
                <option value="home"   ${d.conditions.location_filter==="home"  ?"selected":""}>À la maison uniquement</option>
                <option value="away"   ${d.conditions.location_filter==="away"  ?"selected":""}>Absent uniquement</option>
                <option value="zone_in"  ${d.conditions.location_filter==="zone_in"  ?"selected":""}>Dans une ou plusieurs zones</option>
                <option value="zone_out" ${d.conditions.location_filter==="zone_out" ?"selected":""}>Hors d'une ou plusieurs zones</option>
              </select>
              ${(d.conditions.location_filter==="zone_in" || d.conditions.location_filter==="zone_out") ? `
                <div class="days-row" style="margin-top:10px">
                  ${(this._zones || []).map(z => `
                    <span class="day-btn ${(d.conditions.zones||[]).includes(z.entity_id)?"on":""}"
                          data-a="toggle-zone" data-id="${id}" data-zone="${z.entity_id}">${z.name}</span>
                  `).join("") || `<span style="font-size:12px;color:var(--secondary-text-color,#757575)">Aucune zone disponible</span>`}
                </div>` : ""}
            </div>
            <div class="cond-box">
              <label>⏰ Plage horaire</label>
              <select class="ha-sel" data-a="time-filter" data-id="${id}">
                <option value="always" ${d.conditions.time_filter==="always"?"selected":""}>Toujours</option>
                <option value="range"  ${d.conditions.time_filter==="range" ?"selected":""}>Plage horaire</option>
              </select>
              ${d.conditions.time_filter==="range" ? `
                <div class="time-row">
                  <span>De</span>
                  <input class="ha-inp" type="time" data-a="time-start" data-id="${id}" value="${d.conditions.time_start||"00:00"}" style="flex:1">
                  <span>à</span>
                  <input class="ha-inp" type="time" data-a="time-end"   data-id="${id}" value="${d.conditions.time_end  ||"23:59"}" style="flex:1">
                </div>
                <div class="days-row">
                  ${DAYS.map(day=>`
                    <span class="day-btn ${(d.conditions.days||[]).includes(day.key)?"on":""}"
                          data-a="toggle-day" data-id="${id}" data-day="${day.key}">${day.label}</span>
                  `).join("")}
                </div>` : ""}
            </div>
          </div>

          <!-- Actions -->
          <div class="actions">
            <span class="saved-msg ${this._saved[id]?"show":""}">✓ Sauvegardé</span>
            ${dirty ? `<button class="btn btn-ghost" data-a="revert" data-id="${id}">Annuler</button>` : ""}
            <button class="btn btn-primary" data-a="save" data-id="${id}" ${this._saving[id]?"disabled":""}>
              ${this._saving[id]?"Sauvegarde…":"Sauvegarder"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ─────────────── ADMIN TAB ──────────────────────────────────────────────────

  _renderAdminTab() {
    if(this._adminLoading) return `<div class="loading"><div class="spinner"></div><span>Chargement…</span></div>`;

    return `
      ${this._adminError ? `<div class="error-box">⚠️ ${this._adminError}</div>` : ""}
      ${this._smtpOk === false ? `
        <div class="smtp-warn">
          ⚠️ <strong>SMTP non configuré.</strong>
          Allez dans <strong>Paramètres → Appareils et services → Ajouter une intégration → Email Notify Manager</strong>
          pour configurer le serveur d'envoi.
        </div>` : ""}

      <div class="admin-toolbar">
        <h2>Automations configurées (${this._adminAuts.length})</h2>
        <button class="btn btn-primary" data-a="open-create">+ Nouvelle automation</button>
      </div>

      ${!this._adminAuts.length ? `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <p>Aucune automation. Cliquez sur <strong>+ Nouvelle automation</strong> pour commencer.</p>
        </div>` : `
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Libellé</th>
                  <th>Utilisateurs autorisés</th>
                  <th>Abonnés actifs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._adminAuts.map(a => `
                  <tr>
                    <td><span class="aut-id-code">${a.automation_id}</span></td>
                    <td>${a.label}</td>
                    <td>${(a.allowed_users||[]).join(", ") || "<em style='color:#bbb'>tous</em>"}</td>
                    <td><span class="badge ${a.subscriber_count===0?"zero":""}">${a.subscriber_count}</span></td>
                    <td style="white-space:nowrap;text-align:right">
                      <button class="btn btn-ghost" style="font-size:12px;padding:5px 12px" data-a="edit-aut" data-id="${a.automation_id}">Modifier</button>
                      <button class="btn btn-danger" style="font-size:12px;padding:5px 12px;margin-left:6px" data-a="del-aut" data-id="${a.automation_id}">Supprimer</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="intro" style="margin-top:20px">
          <strong>Comment utiliser dans une automation HA :</strong><br>
          <code style="font-size:12px;display:block;margin-top:6px;white-space:pre-wrap">service: email_notify_manager.send_email_notification
data:
  automation_id: "votre_id"
  title: "Sujet du mail"
  message: "Corps du message"
  html_message: "&lt;h2&gt;Optionnel&lt;/h2&gt;"</code>
        </div>
      `}
    `;
  }

  // ─────────────── MODAL ──────────────────────────────────────────────────────

  _renderModal() {
    const { mode, data } = this._modal;
    const isEdit = mode === "edit";
    const errs   = this._modalErrors;

    return `
      <div class="modal-overlay" data-a="close-modal-bg">
        <div class="modal" data-stop>
          <div class="modal-header">
            <span class="modal-title">${isEdit ? "Modifier l'automation" : "Nouvelle automation"}</span>
            <button class="modal-close" data-a="close-modal">×</button>
          </div>
          <div class="modal-body">

            <div class="form-field">
              <label class="form-label">Identifiant unique *</label>
              <input class="ha-inp" type="text" data-modal="automation_id"
                value="${data.automation_id}"
                placeholder="ex: security_alert"
                ${isEdit ? "readonly" : ""}
                style="${isEdit ? "opacity:.6;background:#eee" : ""}">
              <div class="form-help">Minuscules, chiffres et underscores uniquement. Utilisé dans vos automations HA.</div>
              ${errs.automation_id ? `<div class="form-error">⚠ ${errs.automation_id}</div>` : ""}
            </div>

            <div class="form-field">
              <label class="form-label">Libellé *</label>
              <input class="ha-inp" type="text" data-modal="label"
                value="${data.label}"
                placeholder="ex: Alerte sécurité — Détection mouvement">
              ${errs.label ? `<div class="form-error">⚠ ${errs.label}</div>` : ""}
            </div>

            <div class="form-field">
              <label class="form-label">Utilisateurs autorisés</label>
              <div class="tag-input-wrap" data-user-chips>
                ${(data.allowed_users||[]).map(u => `
                  <div class="user-tag">${u}
                    <button class="user-tag-x" data-a="rm-user" data-user="${u}">×</button>
                  </div>`).join("")}
                <input class="tag-input" type="text"
                  placeholder="username ou user_id (Entrée)"
                  data-user-input>
              </div>
              <div class="form-help">
                Laissez vide pour autoriser tous les utilisateurs.<br>
                Entrez le <strong>username HA</strong> ou le <strong>user_id</strong> (UUID).
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" data-a="close-modal">Annuler</button>
            <button class="btn btn-primary" data-a="save-modal">
              ${isEdit ? "Enregistrer" : "Créer l'automation"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ─────────────── EVENT BINDING ───────────────────────────────────────────────

  _bind() {
    const r = this.shadowRoot;

    // Tabs
    r.querySelectorAll("[data-tab]").forEach(el =>
      el.addEventListener("click", () => { this._tab = el.dataset.tab; this._render(); })
    );

    // User tab
    r.querySelectorAll("[data-toggle]").forEach(el =>
      el.addEventListener("click", () => this._toggleExpand(el.dataset.toggle))
    );
    r.querySelectorAll("[data-a='toggle-enabled']").forEach(el =>
      el.addEventListener("change", () => this._toggleEnabled(el.dataset.id))
    );
    r.querySelectorAll("[data-a='rm-email']").forEach(el =>
      el.addEventListener("click", e => { e.stopPropagation(); this._removeEmail(el.dataset.id, el.dataset.email); })
    );
    r.querySelectorAll("[data-email-input]").forEach(inp => {
      const id = inp.dataset.emailInput;
      const add = () => {
        const v = inp.value.trim();
        if(v && v.includes("@") && !this._drafts[id].emails.includes(v)) {
          this._drafts[id].emails.push(v); inp.value = ""; this._render();
        }
      };
      inp.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===","){ e.preventDefault(); add(); } });
      inp.addEventListener("blur", () => { if(inp.value.includes("@")) add(); });
      const wrap = r.querySelector(`[data-chips="${id}"]`);
      if(wrap) wrap.addEventListener("click", () => inp.focus());
    });
    r.querySelectorAll("[data-a='loc-filter']").forEach(sel =>
      sel.addEventListener("change", () => { this._drafts[sel.dataset.id].conditions.location_filter = sel.value; this._render(); })
    );
    r.querySelectorAll("[data-a='time-filter']").forEach(sel =>
      sel.addEventListener("change", () => { this._drafts[sel.dataset.id].conditions.time_filter = sel.value; this._render(); })
    );
    r.querySelectorAll("[data-a='time-start']").forEach(el =>
      el.addEventListener("change", () => { this._drafts[el.dataset.id].conditions.time_start = el.value; })
    );
    r.querySelectorAll("[data-a='time-end']").forEach(el =>
      el.addEventListener("change", () => { this._drafts[el.dataset.id].conditions.time_end = el.value; })
    );
    r.querySelectorAll("[data-a='toggle-day']").forEach(el =>
      el.addEventListener("click", () => this._toggleDay(el.dataset.id, el.dataset.day))
    );
    r.querySelectorAll("[data-a='toggle-zone']").forEach(el =>
      el.addEventListener("click", () => {
        const zones = this._drafts[el.dataset.id].conditions.zones || [];
        const z = el.dataset.zone;
        const i = zones.indexOf(z);
        if(i >= 0) zones.splice(i, 1); else zones.push(z);
        this._drafts[el.dataset.id].conditions.zones = zones;
        this._render();
      })
    );
    r.querySelectorAll("[data-a='save']").forEach(btn =>
      btn.addEventListener("click", () => this._save(btn.dataset.id))
    );
    r.querySelectorAll("[data-a='revert']").forEach(btn =>
      btn.addEventListener("click", () => this._revert(btn.dataset.id))
    );

    // Admin tab
    r.querySelectorAll("[data-a='open-create']").forEach(btn =>
      btn.addEventListener("click", () => this._openCreate())
    );
    r.querySelectorAll("[data-a='edit-aut']").forEach(btn => {
      const aut = this._adminAuts.find(a => a.automation_id === btn.dataset.id);
      if(aut) btn.addEventListener("click", () => this._openEdit(aut));
    });
    r.querySelectorAll("[data-a='del-aut']").forEach(btn =>
      btn.addEventListener("click", () => this._deleteAutomation(btn.dataset.id))
    );

    // Modal
    const overlay = r.querySelector(".modal-overlay");
    if(overlay) {
      overlay.addEventListener("click", e => {
        if(e.target === overlay) this._closeModal();
      });
    }
    r.querySelectorAll("[data-a='close-modal']").forEach(el =>
      el.addEventListener("click", () => this._closeModal())
    );
    r.querySelectorAll("[data-a='save-modal']").forEach(el =>
      el.addEventListener("click", () => this._saveModal())
    );

    // Modal inputs — sync to this._modal.data
    if(this._modal) {
      r.querySelectorAll("[data-modal]").forEach(inp => {
        inp.addEventListener("input", () => {
          const key = inp.dataset.modal;
          let v = inp.value;
          if(key === "automation_id") v = v.toLowerCase().replace(/[^a-z0-9_]/g, "_");
          this._modal.data[key] = v;
          if(key === "automation_id" && !inp.readOnly) inp.value = v;
        });
      });
      // User tag input
      const tagInp = r.querySelector("[data-user-input]");
      if(tagInp) {
        const addUser = () => {
          const v = tagInp.value.trim();
          if(v && !this._modal.data.allowed_users.includes(v)) {
            this._modal.data.allowed_users.push(v);
            tagInp.value = "";
            this._render();
          }
        };
        tagInp.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===","){ e.preventDefault(); addUser(); } });
        tagInp.addEventListener("blur", () => { if(tagInp.value.trim()) addUser(); });
        const wrap = r.querySelector("[data-user-chips]");
        if(wrap) wrap.addEventListener("click", () => tagInp.focus());
      }
      r.querySelectorAll("[data-a='rm-user']").forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          this._modal.data.allowed_users = this._modal.data.allowed_users.filter(u => u !== btn.dataset.user);
          this._render();
        });
      });
    }
  }

  connectedCallback() { if(this._hass) { this._loadUser(); if(this._isAdmin) this._loadAdmin(); } }
}

customElements.define("email-notify-panel", EmailNotifyPanel);
