/* ============================================================================
 * Karachi Transit App — union operations portal
 * ----------------------------------------------------------------------------
 * Union operators keep route, vehicle and driver data current. Drivers have no
 * app: they phone the union, the operator updates the vehicle here, and the
 * commuter app shows the change within a second (same-origin localStorage sync).
 * ==========================================================================*/
(function () {
  'use strict';
  var KTA = window.KTA;
  var ICON = KTA.assets.icon;

  function $id(s) { return document.getElementById(s); }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function t(k, v) { return KTA.i18n.t(k, v); }
  function routeById(id) { return KTA.sim.routeById(id); }
  function routeColor(r) { return r.type === 'bus' ? '#2563eb' : '#15803d'; }
  function ago(sec) {
    if (sec < 60) return Math.round(sec) + 's ago';
    if (sec < 3600) return Math.round(sec / 60) + ' min ago';
    return Math.round(sec / 3600) + ' h ago';
  }

  var state = {
    view: 'fleet',
    filter: 'all',
    selected: null,
    draft: { status: 'running', delayMin: 10, driver: null, note: '' }
  };

  var VIEWS = [
    { id: 'fleet', icon: 'bus', key: 'union.fleet' },
    { id: 'alerts', icon: 'alert', key: 'union.alerts' },
    { id: 'settings', icon: 'user', key: 'union.settings' }
  ];

  /* ------------------------------------------------------------------ nav */
  function renderNav() {
    $id('sideNav').innerHTML = VIEWS.map(function (v) {
      return '<button data-view="' + v.id + '" class="' + (state.view === v.id ? 'on' : '') + '">' +
        ICON(v.icon, 18) + '<span>' + esc(t(v.key)) + '</span></button>';
    }).join('');
  }

  function show(view) {
    state.view = view;
    renderNav();
    ['fleet', 'alerts', 'settings'].forEach(function (v) {
      $id('view' + v.charAt(0).toUpperCase() + v.slice(1)).style.display = (v === view) ? '' : 'none';
    });
    var titles = {
      fleet: [t('union.fleet'), t('union.manualEdit')],
      alerts: [t('union.alerts'), t('union.published')],
      settings: [t('union.settings'), t('union.driversNote')]
    };
    $id('pageTitle').textContent = titles[view][0];
    $id('pageSub').textContent = titles[view][1];
    renderView();
  }

  function renderView() {
    if (state.view === 'fleet') renderFleet();
    if (state.view === 'alerts') renderAlerts();
    if (state.view === 'settings') renderSettings();
    renderPreviewList();
  }

  /* ---------------------------------------------------------------- fleet */
  function vehiclesWithOps() {
    return KTA.data.VEHICLES.map(function (v) {
      var ops = KTA.sim.opsFor(v.id);
      var r = routeById(v.routeId);
      var prog = KTA.sim.routeProgress(v.routeId) || [];
      var me = prog.filter(function (p) { return p.vehicle.id === v.id; })[0] || {};
      return {
        base: v, route: r, ops: ops,
        driver: ops.driver || v.driver,
        status: ops.status || 'running',
        delayMin: ops.delayMin || 0,
        note: ops.note || '',
        nextStop: me.nextStop, eta: me.etaToNext,
        updatedAt: ops.updatedAt || 0
      };
    });
  }

  function renderFleet() {
    var all = vehiclesWithOps();
    var list = all.filter(function (v) {
      if (state.filter === 'all') return true;
      if (state.filter === 'bus') return v.route.type === 'bus';
      if (state.filter === 'chinchi') return v.route.type === 'chinchi';
      if (state.filter === 'delayed') return v.status === 'delayed';
      if (state.filter === 'oos') return v.status === 'out_of_service';
      return true;
    });

    var rows = list.map(function (v) {
      var badge = v.status === 'out_of_service' ? '<span class="badge oos">' + esc(t('union.oos')) + '</span>'
        : (v.status === 'delayed' ? '<span class="badge est">' + esc(t('union.delayed')) + ' ' + v.delayMin + '′</span>'
          : '<span class="badge live">' + esc(t('union.running')) + '</span>');
      return '<tr data-veh="' + v.base.id + '" class="' + (state.selected === v.base.id ? 'sel' : '') + '">' +
        '<td><span class="plate">' + esc(v.base.plate) + '</span><div class="cell-sub">' + esc(v.base.model) + '</div></td>' +
        '<td><span class="routechip" style="background:' + routeColor(v.route) + '">' + esc(v.route.number) + '</span>' +
        '<div class="cell-sub">' + esc(v.route.name) + '</div></td>' +
        '<td><div class="cell-main">' + esc(v.driver.name) + '</div><div class="cell-sub">' + esc(v.driver.phone) + '</div></td>' +
        '<td>' + badge + '<div class="cell-sub">' + esc(v.nextStop ? '' : '') + (v.updatedAt ? ago((Date.now() - v.updatedAt) / 1000) : '—') + '</div></td>' +
        '</tr>';
    }).join('');

    var filters = [['all', t('union.all')], ['bus', t('union.bus')], ['chinchi', t('union.chinchi')],
      ['delayed', t('union.delayedOnly')], ['oos', t('union.oosOnly')]];

    $id('viewFleet').innerHTML =
      '<div class="panel" style="margin-bottom:12px"><div class="row between" style="align-items:center">' +
      '<div><b>' + esc(t('union.manualEdit')) + '</b><div class="muted">' + esc(t('union.manualEditNote')) + '</div></div>' +
      '<span class="badge live">' + esc(t('union.pointOfTruth')) + '</span></div></div>' +
      '<div class="toolbar">' + filters.map(function (f) {
        return '<button class="chip' + (state.filter === f[0] ? ' on' : '') + '" data-filter="' + f[0] + '">' + esc(f[1]) + '</button>';
      }).join('') + '<span class="muted" style="margin-inline-start:auto">' + list.length + ' vehicles</span></div>' +
      '<div class="split"><div class="panel" style="padding:6px 10px"><table class="grid">' +
      '<thead><tr><th>' + esc(t('union.plate')) + '</th><th>' + esc(t('union.route')) + '</th><th>' + esc(t('union.driver')) + '</th><th>' + esc(t('union.status')) + '</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div id="vehiclePanel">' + renderVehiclePanel() + '</div></div>';

    $id('viewFleet').querySelectorAll('[data-veh]').forEach(function (tr) {
      tr.addEventListener('click', function () { selectVehicle(tr.getAttribute('data-veh')); });
    });
    $id('viewFleet').querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () { state.filter = b.getAttribute('data-filter'); renderFleet(); });
    });
    bindPanel();
  }

  function selectVehicle(vid) {
    state.selected = vid;
    var v = vehiclesWithOps().filter(function (x) { return x.base.id === vid; })[0];
    state.draft = {
      status: v.status, delayMin: v.delayMin || 10,
      driver: v.driver, note: v.note || ''
    };
    renderFleet();
  }

  function renderVehiclePanel() {
    if (!state.selected) {
      return '<div class="panel"><div class="empty">' + esc(t('union.selectVehicle')) + '</div>' +
        '<div class="muted" style="margin-top:10px">' + esc(t('union.manualEditNote')) + '</div></div>';
    }
    var v = vehiclesWithOps().filter(function (x) { return x.base.id === state.selected; })[0];
    if (!v) return '<div class="panel"></div>';

    var drivers = KTA.data.VEHICLES.map(function (x) {
      return { name: x.driver.name, plate: x.plate, id: x.id };
    });
    var opts = drivers.map(function (d) {
      var sel = (state.draft.driver && state.draft.driver.name === d.name) ? ' selected' : '';
      return '<option value="' + esc(d.name + '|' + d.plate) + '"' + sel + '>' + esc(d.name + ' (' + d.plate + ')') + '</option>';
    }).join('');

    var msg = buildMessage(v, state.draft);

    return '<div class="panel">' +
      '<h3>' + esc(t('union.status')) + '</h3>' +
      '<div class="cell-sub" style="margin-bottom:10px"><span class="routechip" style="background:' + routeColor(v.route) + '">' + esc(v.route.number) + '</span> ' +
      '<span class="plate">' + esc(v.base.plate) + '</span> · ' + esc(v.base.model) + '</div>' +
      '<div class="radiogroup" id="statusGroup">' +
      [['running', t('union.running')], ['delayed', t('union.delayed')], ['out_of_service', t('union.oos')]].map(function (o) {
        return '<label class="' + (state.draft.status === o[0] ? 'on' : '') + '" data-status="' + o[0] + '">' +
          '<input type="radio" name="vstatus" value="' + o[0] + '"' + (state.draft.status === o[0] ? ' checked' : '') + '>' + esc(o[1]) + '</label>';
      }).join('') + '</div>' +
      '<div class="field"><label>' + esc(t('union.delayMin')) + '</label>' +
      '<input class="input" id="delayInput" type="number" min="0" max="120" value="' + (state.draft.delayMin || 0) + '"></div>' +
      '<div class="field"><label>' + esc(t('union.reassign')) + '</label>' +
      '<select class="input" id="driverSelect">' + opts + '</select></div>' +
      '<div class="field"><label>' + esc(t('union.note')) + '</label>' +
      '<textarea class="input" id="noteInput" rows="2">' + esc(state.draft.note) + '</textarea></div>' +
      '<button class="btn primary" id="publishBtn">' + ICON('flag', 18) + esc(t('union.publish')) + '</button>' +
      '<div class="preview-note" style="margin-top:14px"><div class="lbl">Commuters will see</div>' + esc(msg.en) + '</div>' +
      '<div class="preview-note" style="margin-top:8px"><div class="lbl">اردو میں</div>' + esc(msg.ur) + '</div>' +
      '</div>';
  }

  function buildMessage(v, draft) {
    var r = v.route;
    var why = (draft.note || '').trim();
    var en = '', ur = '';
    if (draft.status === 'delayed') {
      en = r.number + ' is delayed by ' + (draft.delayMin || 0) + ' minutes' + (why ? ' because of ' + why : '') + '.';
      ur = r.number + ' میں ' + (draft.delayMin || 0) + ' منٹ کی تاخیر ہے' + (why ? ' کیونکہ ' + why : '') + '۔';
    } else if (draft.status === 'out_of_service') {
      en = r.number + ' vehicle ' + v.base.plate + ' is out of service' + (why ? ': ' + why : '') + '.';
      ur = r.number + ' گاڑی ' + v.base.plate + ' سروس میں نہیں ہے' + (why ? ': ' + why : '') + '۔';
    } else {
      en = r.number + ' is running normally again' + (why ? ' — ' + why : '') + '.';
      ur = r.number + ' دوبارہ عام حالت میں ہے' + (why ? ' — ' + why : '') + '۔';
    }
    return { en: en, ur: ur };
  }

  function bindPanel() {
    var g = $id('statusGroup');
    if (!g) return;
    g.querySelectorAll('[data-status]').forEach(function (l) {
      l.addEventListener('click', function () {
        state.draft.status = l.getAttribute('data-status');
        g.querySelectorAll('[data-status]').forEach(function (x) { x.classList.toggle('on', x === l); });
        g.querySelectorAll('input').forEach(function (i) { i.checked = (i.value === state.draft.status); });
        var v = vehiclesWithOps().filter(function (x) { return x.base.id === state.selected; })[0];
        var msg = buildMessage(v, state.draft);
        var notes = $id('viewFleet').querySelectorAll('.preview-note');
        if (notes[0]) notes[0].lastChild.textContent = msg.en;
        if (notes[1]) notes[1].lastChild.textContent = msg.ur;
      });
    });
    var delay = $id('delayInput');
    if (delay) delay.addEventListener('input', function () { state.draft.delayMin = parseInt(delay.value || '0', 10); });
    var note = $id('noteInput');
    if (note) note.addEventListener('input', function () { state.draft.note = note.value; });
    var dsel = $id('driverSelect');
    if (dsel) dsel.addEventListener('change', function () {
      var parts = dsel.value.split('|');
      state.draft.driver = { name: parts[0], plate: parts[1] };
    });
    var pub = $id('publishBtn');
    if (pub) pub.addEventListener('click', publish);
  }

  function publish() {
    var v = vehiclesWithOps().filter(function (x) { return x.base.id === state.selected; })[0];
    if (!v) return;
    var draft = state.draft;
    var driverChanged = draft.driver && draft.driver.name !== v.driver.name;

    var patch = {
      status: draft.status,
      delayMin: draft.status === 'delayed' ? (draft.delayMin || 0) : 0,
      note: draft.note || '',
      driver: draft.driver || null
    };
    KTA.sim.setVehicleOps(v.base.id, patch);

    var msg = buildMessage(v, draft);
    var alert = {
      routeId: v.route.id, routeNumber: v.route.number, routeName: v.route.name, routeNameUr: v.route.ur,
      vehicleId: v.base.id, plate: v.base.plate,
      severity: draft.status === 'out_of_service' ? 'out_of_service' : (draft.status === 'delayed' ? 'delayed' : 'info'),
      message: msg.en, messageUr: msg.ur,
      why: draft.note || '', delayMin: patch.delayMin
    };
    if (driverChanged) {
      alert.severity = 'driver_changed';
      alert.message = 'The driver for ' + v.route.number + ' (' + v.base.plate + ') is now ' + draft.driver.name + '.' + (draft.note ? ' ' + draft.note : '');
      alert.messageUr = v.route.number + ' (' + v.base.plate + ') کے ڈرائیور کو تبدیل کر کے ' + draft.driver.name + ' کو مقرر کیا گیا ہے۔' + (draft.note ? ' ' + draft.note : '');
    }
    KTA.sim.publishAlert(alert);
    toast(t('union.published'));
    renderFleet();
  }

  /* --------------------------------------------------------------- alerts */
  function renderAlerts() {
    var alerts = KTA.sim.alerts();
    $id('viewAlerts').innerHTML = alerts.length ? alerts.map(function (a) {
      var sev = a.severity === 'out_of_service' ? 'oos' : (a.severity === 'delayed' ? 'est' : 'info');
      var mins = Math.max(1, Math.round((Date.now() - a.at) / 60000));
      return '<div class="panel" style="margin-bottom:10px">' +
        '<div class="row between" style="margin-bottom:6px">' +
        '<div><span class="routechip" style="background:' + (routeById(a.routeId) ? routeColor(routeById(a.routeId)) : '#64748b') + '">' + esc(a.routeNumber) + '</span> ' +
        '<b>' + esc(a.routeName) + '</b></div>' +
        '<span class="badge ' + sev + '">' + esc(a.severity.replace('_', ' ')) + '</span></div>' +
        '<div class="muted">' + esc(a.message) + '</div>' +
        '<div class="muted" style="direction:rtl;text-align:right;margin-top:4px">' + esc(a.messageUr) + '</div>' +
        '<div class="tiny muted" style="margin-top:6px">' + esc(a.plate || '') + ' · ' + mins + ' min ago</div>' +
        '</div>';
    }).join('') : '<div class="empty">' + esc(t('union.noAlerts')) + '</div>';
  }

  /* ------------------------------------------------------------- settings */
  function renderSettings() {
    $id('viewSettings').innerHTML =
      '<div class="panel" style="margin-bottom:12px"><h3>' + esc(t('union.union')) + '</h3>' +
      KTA.data.UNIONS.map(function (u) {
        return '<div class="kv"><span class="k">' + esc(u.name) + '</span><span>' + u.routes.length + ' routes · ' + esc(u.operator) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="panel" style="margin-bottom:12px"><h3>' + esc(t('union.driversNote')) + '</h3>' +
      '<div class="muted">Every vehicle has exactly one driver in the database. When a driver is replaced, the union changes the record here; commuters see the new name on the vehicle card and an alert on that route.</div></div>' +
      '<div class="panel"><h3>Prototype controls</h3>' +
      '<button class="btn ghost" id="resetAll">' + ICON('refresh', 18) + esc(t('more.reset')) + '</button></div>';
    $id('resetAll').addEventListener('click', function () {
      if (window.confirm(t('more.resetConfirm'))) { KTA.store.reset(); renderView(); toast(t('more.reset')); }
    });
  }

  /* -------------------------------------------------------------- preview */
  function renderPreviewList() {
    var alerts = KTA.sim.alerts().slice(0, 4);
    $id('pvList').innerHTML = alerts.length
      ? '<div class="muted" style="margin-bottom:6px">Latest published alerts</div>' +
      alerts.map(function (a) {
        return '<div class="item"><b>' + esc(a.routeNumber) + '</b> ' + esc(a.message) + '</div>';
      }).join('')
      : '<div class="item muted">No alerts published yet. Update a vehicle status to create one.</div>';
    $id('pvNote').textContent = 'The preview is the real commuter app. Open it in a second tab to see the live update; both read the same simulated data.';
  }

  /* ---------------------------------------------------------------- toast */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      Object.assign(toastEl.style, {
        position: 'fixed', insetBlockEnd: 'max(var(--space-4), env(safe-area-inset-bottom))',
        insetInlineStart: '50%', transform: 'translateX(-50%)',
        background: 'var(--ink)', color: 'var(--surface)', padding: 'var(--space-3) var(--space-6)',
        borderRadius: 'var(--radius)', zIndex: '999', fontSize: 'var(--text-base)', boxShadow: 'var(--shadow-lg)'
      });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.style.opacity = '0'; }, 2600);
  }

  /* ----------------------------------------------------------------- boot */
  function boot() {
    $id('sideNav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]');
      if (!b) return;
      show(b.getAttribute('data-view'));
    });
    $id('pvOpen').href = '../commuter/index.html';
    $id('sideNoteBody').textContent = 'Drivers have no app. They phone the union; the operator opens the vehicle below and updates status, delay, driver and note by hand. Commuters see the change on their map within seconds.';
    $id('brandTitle').textContent = t('union.title');
    $id('pvTitle').textContent = t('union.preview');
    show('fleet');

    KTA.store.onChange(function () { renderNav(); renderView(); });

    setInterval(function () { renderPreviewList(); }, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
