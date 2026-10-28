/* ============================================================================
 * Karachi Transit App — commuter application (Phase 2 prototype)
 * ----------------------------------------------------------------------------
 * Implements the four evaluation tasks end to end:
 *   T1 find a route            T2 track a bus + ETA
 *   T3 plan a two-vehicle trip T4 SOS (hold + cancel) and robbery report
 * ==========================================================================*/
(function () {
  'use strict';
  var KTA = window.KTA;
  var ICON = KTA.assets.icon, LAND = KTA.assets.landmarkSVG, STARS = KTA.assets.starsHTML;

  var LANG = 'en';
  function t(k, v) { return KTA.i18n.t(k, v); }
  function $id(s) { return document.getElementById(s); }

  /* ------------------------------------------------------------- utilities */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function stopById(id) { return KTA.sim.stopById(id); }
  function stopName(id) { var s = stopById(id); if (!s) return id; return LANG === 'ur' ? s.ur : s.name; }
  function stopLandmark(id) { var s = stopById(id); if (!s) return ''; return LANG === 'ur' ? s.landmarkUr : s.landmark; }
  function routeById(id) { return KTA.sim.routeById(id); }
  function routeName(r) { return LANG === 'ur' ? r.ur : r.name; }
  function fmtMin(m) {
    if (m === null || m === undefined) return '—';
    if (m < 0.7) return t('common.now');
    return (Math.round(m * 10) / 10) + ' ' + t('common.min');
  }
  function agoText(sec) { return t('eta.updated', { n: Math.round(sec) }); }
  function routeColor(r) { return r.type === 'bus' ? '#2563eb' : '#15803d'; }
  function routeChipColor() { return '#2563eb'; }

  /* ------------------------------------------------------------------ state */
  var state = {
    screen: 'home',
    routeFilter: 'all',
    routeQuery: '',
    mapRoutes: null,          /* null = every route; otherwise array of route ids */
    mapFocusRoute: null,
    view: { x: 0, y: 0, w: 1000, h: 640 },
    mapViewInitialized: false,
    mapViewFit: true,
    planPick: null,
    currentRoute: null,
    currentStop: null,
    currentVehicle: null,
    offline: false,
    planFrom: null,
    planTo: null,
    planResult: null,
    sos: { phase: 'idle', raf: null, startTs: 0, countdown: 5, timer: null },
    review: null,
    lastQuery: '',
    online: true
  };

  /* ------------------------------------------------------------- navigation */
  var SCREENS = ['home', 'map', 'routes', 'route', 'stop', 'plan', 'safety', 'more', 'alerts'];

  function go(screen, opts) {
    opts = opts || {};
    var prev = state.screen;
    state.screen = screen;
    SCREENS.forEach(function (s) {
      var el = document.querySelector('.screen[data-screen="' + s + '"]');
      if (el) el.classList.toggle('active', s === screen);
    });
    var sc = document.querySelector('.screen[data-screen="' + screen + '"]');
    if (sc) sc.scrollTop = 0;
    if (prev !== screen) KTA.evalTool.log('screen', { from: prev, to: screen });
    if (opts.render !== false) renderScreen(screen);
    updateTabs();
    if (screen === 'map') renderMap();
  }

  function back() {
    var backMap = { route: 'routes', stop: 'home', safety: 'home', alerts: 'home', more: 'home' };
    go(backMap[state.screen] || 'home');
  }

  function updateTabs() {
    var tabs = document.querySelectorAll('#tabbar button');
    var active = { route: 'routes', stop: 'map', safety: 'home', alerts: 'home' }[state.screen] || state.screen;
    tabs.forEach(function (b) {
      var selected = b.getAttribute('data-tab') === active;
      b.classList.toggle('active', selected);
      if (selected) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  /* ------------------------------------------------------------------ toast */
  var toastTimer = null;
  function toast(msg) {
    var el = $id('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ------------------------------------------------------------------ sheet */
  function openSheet(html, onOpen) {
    $id('sheet').innerHTML = '<div class="grab"></div>' + html;
    $id('scrim').classList.add('open');
    if (onOpen) onOpen($id('sheet'));
  }
  function closeSheet() { $id('scrim').classList.remove('open'); $id('sheet').innerHTML = ''; }

  /* =============================================================== HOME ==== */
  function renderHome() {
    renderHomeAlerts();
    renderHomePlaces();
    renderHomeNearby();
    renderOfflineBanner();
  }

  function renderHomeAlerts() {
    var alerts = KTA.sim.activeAlerts();
    var host = $id('homeAlerts');
    if (!alerts.length) { host.innerHTML = ''; return; }
    host.innerHTML = alerts.slice(0, 2).map(function (a) {
      var sev = a.severity === 'out_of_service' ? 'danger' : 'info';
      var body = LANG === 'ur' ? a.messageUr : a.message;
      return '<div class="banner ' + sev + '" style="margin-bottom:10px" role="status">' +
        ICON('alert', 18) +
        '<div class="grow"><strong>' + esc(a.routeNumber ? a.routeNumber + ' · ' + (LANG === 'ur' ? a.routeNameUr : a.routeName) : t('alerts.title')) + '</strong>' +
        esc(body) + '</div>' +
        '<button class="link" data-open-alert="1" style="color:inherit">›</button></div>';
    }).join('');
  }

  function renderOfflineBanner() {
    var host = $id('offlineBanner');
    if (!state.offline) { host.innerHTML = ''; return; }
    var age = Math.max(1, Math.round(KTA.sim.offlineAgeSec() / 60));
    host.innerHTML = '<div class="banner danger" style="margin-bottom:10px" role="status">' + ICON('alert', 18) +
      '<div><strong>' + esc(t('eta.offline')) + '</strong>' + esc(t('eta.offlineBody')) +
      '<div style="opacity:.85;margin-top:2px">' + esc(t('eta.offlineAge', { n: age })) + '</div></div></div>';
  }

  function renderHomePlaces() {
    var host = $id('homePlaces');
    host.innerHTML = KTA.data.PLACES.map(function (p) {
      return '<button class="chip" data-place="' + p.id + '">' + ICON('pin', 14) +
        esc(LANG === 'ur' ? p.ur : p.en) + '</button>';
    }).join('');
  }

  function renderHomeNearby() {
    var host = $id('homeNearby');
    var nearby = ['st_jpo', 'st_ghanta', 'st_empress'];
    var rows = [];
    nearby.forEach(function (sid) {
      var arrivals = KTA.sim.arrivalsForStop(sid).slice(0, 2);
      var s = stopById(sid);
      arrivals.forEach(function (a) {
        var existing = rows.filter(function (row) { return row.arr.routeId === a.routeId; })[0];
        if (!existing) {
          rows.push({ arr: a, stop: s });
        } else if (a.minutes < existing.arr.minutes) {
          existing.arr = a;
          existing.stop = s;
        }
      });
    });
    rows.sort(function (a, b) { return a.arr.minutes - b.arr.minutes; });
    rows = rows.slice(0, 4);
    if (!rows.length) { host.innerHTML = '<div class="empty">' + esc(t('stop.noBus')) + '</div>'; return; }
    host.innerHTML = rows.map(function (r) {
      return etaCardHtml(r.arr, r.stop);
    }).join('');
  }

  function etaCardHtml(a, stop) {
    var offline = state.offline;
    var badge = offline
      ? '<span class="badge est">' + esc(t('eta.lastKnown')) + '</span>'
      : (a.live
        ? '<span class="badge live"><span class="pulse"></span>' + esc(t('eta.live')) + '</span>'
        : '<span class="badge est">' + esc(t('eta.estimated')) + '</span>');
    var age = offline
      ? t('eta.offlineAge', { n: Math.max(1, Math.round(KTA.sim.offlineAgeSec() / 60)) })
      : (a.live
        ? (a.stale ? t('eta.stale', { n: Math.round(a.liveAgeSec / 60) }) : agoText(a.liveAgeSec))
        : t('eta.scheduled', { n: a.estimatedAgeMin }));
    var route = routeById(a.routeId);
    return '<button type="button" class="eta-card" data-stop="' + esc(a.stopId || (stop && stop.id) || '') + '">' +
      '<span class="routechip" style="background:' + routeChipColor(route) + '">' + esc(route.number) + '</span>' +
      '<span class="eta-meta grow">' +
      '<span class="line1">' + esc(routeName(route)) + ' ' + badge + '</span>' +
      '<span class="line2">' + (stop ? esc(stopName(stop.id)) + ' · ' : '') + esc(age) +
      (a.status === 'delayed' ? ' · ' + esc(t('eta.delayed', { n: a.delayMin })) : '') + '</span>' +
      '</span>' +
      '<span class="eta-main"><span class="num">' + (a.minutes < 0.7 ? esc(t('common.now')) : Math.round(a.minutes)) + '</span>' +
      '<span class="unit">' + (a.minutes < 0.7 ? '' : esc(t('common.min'))) + '</span></span>' +
      '</button>';
  }

  function renderSearchResults(query) {
    var host = $id('homeResults');
    state.lastQuery = query;
    if (!query || query.trim().length < 2) { host.innerHTML = ''; return; }
    var res = KTA.sim.search(query);
    var html = '';
    if (res.routes.length) {
      html += '<div class="section-title">' + esc(LANG === 'ur' ? 'روٹس' : 'Routes') + '</div>';
      html += res.routes.map(function (r) {
        return '<button class="result" data-route="' + r.id + '">' +
          '<span class="routechip" style="background:' + routeChipColor(r) + '">' + esc(r.number) + '</span>' +
          '<span class="grow"><span class="rttl">' + esc(routeName(r)) + '</span>' +
          '<span class="rsub">' + esc(r.operator) + '</span></span></button>';
      }).join('');
    }
    if (res.stops.length) {
      html += '<div class="section-title">' + esc(LANG === 'ur' ? 'اسٹاپس' : 'Stops') + '</div>';
      html += res.stops.slice(0, 6).map(function (s) {
        return '<button class="result" data-stop="' + s.id + '">' +
          ICON(s.kind === 'informal' ? 'rickshaw' : 'pin', 18) +
          '<span class="grow"><span class="rttl">' + esc(LANG === 'ur' ? s.ur : s.name) + '</span>' +
          '<span class="rsub">' + esc(LANG === 'ur' ? s.landmarkUr : s.landmark) + '</span></span>' +
          '<span class="badge neutral">' + esc(s.kind === 'informal' ? t('stop.informal') : t('stop.formal')) + '</span></button>';
      }).join('');
    }
    if (!html) html = '<div class="empty">' + esc(t('common.noResults') || 'No results') + '</div>';
    host.innerHTML = html;
  }

  /* =============================================================== MAP ==== */
  function renderMap() {
    var svg = $id('mapSvg');
    document.querySelector('.screen[data-screen="map"]').classList.toggle('plan-picking', !!state.planPick);
    if (!svg.getAttribute('data-built')) {
      svg.innerHTML = buildMapSvg();
      svg.setAttribute('data-built', '1');
      bindMapEvents(svg);
    }
    applyMapFilter();
    updateMapVehicles();
    renderMapBanner();
    renderMapChips();
    if (!state.mapViewInitialized) {
      fitMapToViewport();
      state.mapViewInitialized = true;
    } else {
      applyView();
    }
  }

  function buildMapSvg() {
    var p = [];
    p.push('<rect class="map-background" x="0" y="0" width="1000" height="640"/>');
    p.push('<path class="map-water" d="M0 545 C95 535 128 502 205 518 C283 534 321 570 397 568 C469 567 513 535 581 544 L640 640 L0 640 Z"/>');
    p.push('<path class="map-shore" d="M0 545 C95 535 128 502 205 518 C283 534 321 570 397 568 C469 567 513 535 581 544"/>');
    p.push('<text x="60" y="600" class="stop-label map-sea-label">Arabian Sea</text>');
    p.push('<path class="map-park" d="M160 246 C175 228 202 230 215 247 C228 266 215 287 194 291 C173 295 155 276 160 246 Z"/>');
    p.push('<path class="map-park" d="M250 359 C264 343 288 345 299 362 C310 380 298 399 279 402 C260 405 245 387 250 359 Z"/>');
    var roads = [
      'M8 382 C42 365 70 350 97 345 S170 292 218 240 S290 184 331 173 S420 230 488 284',
      'M158 25 C175 70 148 105 151 141 S143 185 121 206 S90 278 97 345 S75 401 92 426',
      'M8 376 C35 370 44 354 50 354 S76 371 97 345 S160 320 203 334 S230 302 197 295',
      'M49 485 C63 462 80 441 92 426 S102 380 97 345',
      'M90 210 C132 211 166 209 205 188 S267 180 282 202 S382 252 408 266',
      'M145 529 C145 486 120 459 92 426 S100 380 97 345',
      'M442 425 C470 365 488 330 488 284 S472 255 469 244'
    ];
    p.push('<g class="map-streets" aria-hidden="true">');
    roads.forEach(function (path) {
      p.push('<path class="map-road-edge" d="' + path + '"/><path class="map-road" d="' + path + '"/>');
    });
    p.push('<path class="map-grid" d="M82 255 L174 250 M133 296 L225 286 M76 455 L130 470 M245 220 L315 186 M420 330 L490 350"/>');
    p.push('</g>');
    /* area labels */
    var areas = [['Saddar', 72, 320], ['Clifton', 102, 458], ['PECHS', 208, 365], ['Bahadurabad', 216, 274],
      ['University Rd', 292, 184], ['Federal B Area', 207, 174], ['Gulshan-e-Hadeed', 878, 347],
      ['Korangi', 445, 454], ['Malir', 505, 270], ['Nazimabad', 76, 187], ['North Nazimabad', 166, 124],
      ['Liaquatabad', 151, 252], ['Airport', 456, 225], ['Sea View', 28, 510]];
    areas.forEach(function (a) {
      p.push('<text x="' + a[1] + '" y="' + a[2] + '" class="stop-label area-label">' + a[0] + '</text>');
    });
    /* route lines */
    KTA.data.ROUTES.forEach(function (r) {
      var pts = r.path.map(function (q) { return q[0] + ',' + q[1]; }).join(' ');
      p.push('<polyline class="route-line" data-route-line="' + r.id + '" points="' + pts +
        '" stroke="' + routeColor(r) + '" stroke-width="' + (r.type === 'bus' ? 5 : 3.5) + '"/>');
    });
    /* stops — each stop and its label live in one group so the map filter
       can hide both together */
    var mapLabels = {
      st_chund: ['KPT Head Office', 'کے پی ٹی ہیڈ آفس'],
      st_ned: ['NED', 'این ای ڈی'],
      st_liaq: ['Liaquatabad', 'لیاقت آباد'],
      st_gol: ['Gol Market', 'گول مارکیٹ'],
      st_nazimabad: ['Nazimabad No. 4', 'ناظم آباد نمبر ۴'],
      st_north: ['Five Star Chowrangi', 'فائیو اسٹار چورنگی'],
      st_sf: ['Hasan Square', 'حسن اسکوائر'],
      st_qai: ['Airport corridor', 'ایئرپورٹ کوریڈور'],
      st_airport: ['Jinnah Airport', 'جناح ایئرپورٹ'],
      st_pechs: ['PECHS Block 6', 'پی ای سی ایچ ایس بلاک ۶'],
      st_bahadur: ['Bahadurabad', 'بہادرآباد'],
      st_uni: ['NIPA Bus Stop', 'نیپا بس اسٹاپ'],
      st_fedb: ['Federal B Area', 'فیڈرل بی ایریا'],
      st_korangi: ['Korangi No. 4', 'کورنگی نمبر ۴'],
      st_malir: ['Malir Halt', 'ملیر ہالٹ'],
      st_ghanta: ['Merewether Tower', 'میری ویدر ٹاور'],
      st_kmc: ['KMC Building', 'کے ایم سی بلڈنگ'],
      st_seabreeze: ['Sea Breeze Centre', 'سی بریز سینٹر'],
      st_askari: ['Do Darya', 'دو دریا'],
      st_svr: ['Sea View Road', 'سی ویو روڈ'],
      st_nipa: ['NIPA Chinchi', 'نیپا چنچی'],
      st_peshwari: ['Peshawari Ice Cream', 'پشاوری آئس کریم'],
      st_pechs2: ['PECHS Block 2', 'پی ای سی ایچ ایس بلاک ۲'],
      st_bhattigate: ['Regal Chowk', 'ریگل چوک'],
      st_newkhi: ['New Karachi area', 'نیو کراچی کا علاقہ']
    };
    var labelOffsets = {
      st_jpo: [8, -9], st_empress: [8, -20], st_chund: [8, 14],
      st_ghanta: [8, -9], st_kmc: [30, 30], st_seabreeze: [8, 14],
      st_clifton: [-8, -10], st_askari: [8, -9], st_seaview: [8, -10],
      st_svr: [-8, 16], st_uni: [-8, -10], st_nipa: [8, 16],
      st_gulshan: [-8, -9], st_bahadur: [-8, -10], st_peshwari: [8, 15],
      st_gol: [-8, -10], st_nazimabad: [8, 14], st_north: [8, -9],
      st_newkhi: [8, 18], st_bhattigate: [-8, 16], st_pechs: [-8, -9],
      st_pechs2: [8, 16], st_fedb: [-8, -10], st_malir: [8, 14],
      st_sf: [8, -10], st_qai: [8, 15], st_airport: [8, -10],
      st_korangi: [8, 14], st_liaq: [8, -9], st_ned: [8, -10]
    };
    KTA.data.STOPS.forEach(function (s) {
      var offset = labelOffsets[s.id] || [8, 3.5];
      var mapLabel = mapLabels[s.id];
      var label = mapLabel ? (LANG === 'ur' ? mapLabel[1] : mapLabel[0]) : stopName(s.id);
      p.push('<g class="stop-group" data-stop-group="' + s.id + '">');
      if (s.kind === 'informal') {
        p.push('<rect class="stop-dot" data-stop="' + s.id + '" x="' + (s.x - 5) + '" y="' + (s.y - 5) +
          '" width="10" height="10" rx="2.5" fill="#f59e0b" stroke="#fff" tabindex="0" role="button" aria-label="' + esc(stopName(s.id)) + '"/>');
      } else {
        p.push('<circle class="stop-dot" data-stop="' + s.id + '" cx="' + s.x + '" cy="' + s.y +
          '" r="5.5" fill="#0f766e" stroke="#fff" tabindex="0" role="button" aria-label="' + esc(stopName(s.id)) + '"/>');
      }
      p.push('<text x="' + (s.x + offset[0]) + '" y="' + (s.y + offset[1]) +
        '" text-anchor="' + (offset[0] < 0 ? 'end' : 'start') + '" class="stop-label">' +
        esc(label) + '</text>');
      p.push('</g>');
    });
    p.push('<g id="vehLayer"></g>');
    return p.join('');
  }

  /* ------------------------------------------------------ map route filter */
  /* The map can be narrowed to one or more individual routes (a bus or a
     chinchi, or any mix of them). state.mapRoutes === null means "no
     filter, show every route". Otherwise it holds the ids of the routes the
     user ticked. A focused route is always added to the visible set so that
     "view this route on the map" works whatever the filter is. */
  function allRouteIds() {
    return KTA.data.ROUTES.map(function (r) { return r.id; });
  }
  function routeIdsOfType(type) {
    return KTA.data.ROUTES.filter(function (r) { return r.type === type; })
      .map(function (r) { return r.id; });
  }
  function selectedRouteIds() {
    return state.mapRoutes ? state.mapRoutes.slice() : allRouteIds();
  }
  function visibleRouteIds() {
    var ids = selectedRouteIds();
    if (state.mapFocusRoute && ids.indexOf(state.mapFocusRoute) === -1) ids.push(state.mapFocusRoute);
    return ids;
  }
  function sameRouteSet(a, b) {
    if (a.length !== b.length) return false;
    return a.every(function (id) { return b.indexOf(id) !== -1; });
  }
  function setMapRoutes(ids) {
    var all = allRouteIds();
    state.mapRoutes = (!ids || sameRouteSet(ids, all)) ? null : ids.slice();
    applyMapFilter();
    updateMapVehicles();
    renderMapChips();
  }
  function toggleMapRoute(id) {
    var cur = selectedRouteIds();
    var i = cur.indexOf(id);
    if (i === -1) cur.push(id); else cur.splice(i, 1);
    /* ticking off the last route returns to "show everything" rather than an
       empty map, so the user can never get stuck with a blank screen */
    if (!cur.length) cur = allRouteIds();
    setMapRoutes(cur);
  }

  /* hide the lines and stops of every route that is not selected */
  function applyMapFilter() {
    var svg = $id('mapSvg');
    if (!svg) return;
    var ids = visibleRouteIds();
    svg.querySelectorAll('[data-route-line]').forEach(function (el) {
      el.style.display = ids.indexOf(el.getAttribute('data-route-line')) === -1 ? 'none' : '';
    });
    svg.querySelectorAll('[data-stop-group]').forEach(function (g) {
      var sid = g.getAttribute('data-stop-group');
      var served = KTA.sim.routesServingStop(sid).some(function (r) {
        return ids.indexOf(r.id) !== -1;
      });
      g.style.display = served ? '' : 'none';
    });
  }

  function updateMapVehicles() {
    var layer = document.getElementById('vehLayer');
    if (!layer) return;
    var ids = visibleRouteIds();
    var html = '';
    KTA.sim.vehicles().forEach(function (v) {
      if (ids.indexOf(v.routeId) === -1) return;   /* route filtered out */
      var r = routeById(v.routeId);
      var focus = state.mapFocusRoute && state.mapFocusRoute !== v.routeId;
      var op = focus ? 0.18 : 1;
      var color = v.status === 'out_of_service' ? '#d92d20' : routeColor(r);
      var vehicleAttrs = ' tabindex="0" role="button" aria-label="' +
        esc(r.number + ' ' + (r.type === 'bus' ? 'bus' : 'chinchi') + ', ' + v.plate +
          (v.status === 'out_of_service' ? ', out of service' : '')) + '"';
      if (v.status === 'out_of_service') {
        html += '<g class="veh" data-veh="' + v.id + '"' + vehicleAttrs + ' transform="translate(' + v.x + ',' + v.y + ')" opacity="' + op + '">' +
          '<circle r="9" fill="#fff" stroke="#d92d20" stroke-width="2.5"/>' +
          '<path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#d92d20" stroke-width="2.5"/>' +
          '<text class="veh-label" x="0" y="-14" text-anchor="middle" fill="#d92d20">' + esc(r.number) + '</text></g>';
      } else if (r.type === 'bus') {
        html += '<g class="veh" data-veh="' + v.id + '"' + vehicleAttrs + ' transform="translate(' + v.x + ',' + v.y + ')" opacity="' + op + '">' +
          '<g transform="rotate(' + (v.heading) + ')"><rect x="-11" y="-7" width="22" height="14" rx="4" fill="' + color + '" stroke="#fff" stroke-width="2"/></g>' +
          '<text class="veh-label" x="0" y="-13" text-anchor="middle">' + esc(r.number) + '</text></g>';
      } else {
        html += '<g class="veh" data-veh="' + v.id + '"' + vehicleAttrs + ' transform="translate(' + v.x + ',' + v.y + ')" opacity="' + op + '">' +
          '<circle r="7.5" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
          '<text class="veh-label" x="0" y="-13" text-anchor="middle">' + esc(r.number) + '</text></g>';
      }
    });
    layer.innerHTML = html;
  }

  function renderMapBanner() {
    var host = $id('mapBanner');
    var html = '';
    if (state.planPick) {
      html += '<div class="banner info" role="status">' + ICON('pin', 16) +
        '<div class="grow"><strong>' + esc(t(state.planPick === 'from' ? 'plan.pickFrom' : 'plan.pickTo')) + '</strong></div>' +
        '<button class="btn compact plan-cancel" type="button" data-plan-cancel aria-label="' + esc(t('plan.cancelPick')) + '">' +
        esc(t('plan.cancelPick')) + '</button></div>';
    }
    if (state.offline) {
      html += '<div class="banner danger">' + ICON('alert', 16) +
        '<div class="grow"><strong>' + esc(t('eta.offline')) + '</strong>' +
        esc(t('eta.offlineAge', { n: Math.max(1, Math.round(KTA.sim.offlineAgeSec() / 60)) })) + '</div></div>';
    }
    var alerts = KTA.sim.activeAlerts();
    if (alerts.length) {
      var a = alerts[0];
      var sev = a.severity === 'out_of_service' ? 'danger' : 'info';
      html += '<div class="banner ' + sev + '">' + ICON('alert', 16) +
        '<div class="grow"><strong>' + esc(a.routeNumber) + '</strong>' +
        esc(LANG === 'ur' ? a.messageUr : a.message) + '</div></div>';
    }
    host.innerHTML = html;
  }

  function renderMapChips() {
    var host = $id('mapChips');
    var sel = selectedRouteIds();
    var all = allRouteIds();
    var busIds = routeIdsOfType('bus');
    var chinIds = routeIdsOfType('chinchi');
    var isAll = !state.mapRoutes;
    var isBus = !isAll && sameRouteSet(sel, busIds);
    var isChin = !isAll && sameRouteSet(sel, chinIds);

    var typeChips = [
      ['all', t('routes.all'), isAll],
      ['bus', t('routes.bus'), isBus],
      ['chinchi', t('routes.chinchi'), isChin]
    ].map(function (o) {
      return '<button class="chip' + (o[2] ? ' on' : '') + '" data-mapfilter="' + o[0] + '" aria-pressed="' + (o[2] ? 'true' : 'false') + '">' + esc(o[1]) + '</button>';
    }).join('');

    var routeChips = KTA.data.ROUTES.map(function (r) {
      var on = sel.indexOf(r.id) !== -1;
      return '<button class="chip mc-route' + (on ? ' on' : '') + '" data-maproute="' + r.id + '" ' +
        'style="--mc:' + routeColor(r) + '" aria-pressed="' + (on ? 'true' : 'false') + '" ' +
        'title="' + esc(r.name) + '">' + esc(r.number) + '</button>';
    }).join('');

    var count = t('map.routesShown', { n: visibleRouteIds().length, m: all.length });

    host.innerHTML =
      '<div class="mc-row mc-row-type">' + typeChips +
      '<span class="mc-count">' + esc(count) + '</span></div>' +
      '<div class="mc-row mc-row-routes"><span class="mc-lbl">' + esc(t('map.selectedRoutes')) + '</span>' +
      routeChips + '</div>' +
      (state.mapFocusRoute ? '<div class="mc-row mc-row-focus"><button class="chip on" data-mapfocus="1">' +
        ICON('close', 13) + esc(routeName(routeById(state.mapFocusRoute))) + '</button></div>' : '');
  }

  function applyView() {
    var svg = $id('mapSvg');
    if (!svg) return;
    var v = state.view;
    svg.setAttribute('viewBox', v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h);
  }

  function fitMapToViewport() {
    var svg = $id('mapSvg');
    if (!svg) return;
    var rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var aspect = rect.width / rect.height;
    var width, height;
    if (aspect < 1000 / 640) {
      height = 640;
      width = height * aspect;
    } else {
      width = 1000;
      height = width / aspect;
    }
    state.view = {
      x: (1000 - width) / 2,
      y: (640 - height) / 2,
      w: width,
      h: height
    };
    state.mapViewFit = true;
    applyView();
  }

  function bindMapEvents(svg) {
    var drag = null;
    svg.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-stop]') || e.target.closest('[data-veh]')) return;
      drag = { x: e.clientX, y: e.clientY, vx: state.view.x, vy: state.view.y };
      state.mapViewFit = false;
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var rect = svg.getBoundingClientRect();
      var sx = state.view.w / rect.width, sy = state.view.h / rect.height;
      state.view.x = drag.vx - (e.clientX - drag.x) * sx;
      state.view.y = drag.vy - (e.clientY - drag.y) * sy;
      applyView();
    });
    svg.addEventListener('pointerup', function () { drag = null; });
    svg.addEventListener('pointercancel', function () { drag = null; });
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 1.15 : 0.87);
    }, { passive: false });
    svg.addEventListener('keydown', function (e) {
      var stopEl = e.target.closest('[data-stop]');
      var vehEl = e.target.closest('[data-veh]');
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (vehEl) {
        e.preventDefault();
        e.stopPropagation();
        KTA.evalTool.log('tap', { target: 'map-veh:' + vehEl.getAttribute('data-veh') });
        openVehicleSheet(vehEl.getAttribute('data-veh'));
        return;
      }
      if (!stopEl) return;
      e.preventDefault();
      e.stopPropagation();
      var stopId = stopEl.getAttribute('data-stop');
      if (state.planPick) selectPlanStop(stopId); else openStopSheet(stopId);
    });
    svg.addEventListener('click', function (e) {
      var stopEl = e.target.closest('[data-stop]');
      if (stopEl) {
        e.stopPropagation();
        KTA.evalTool.log('tap', { target: 'map-stop:' + stopEl.getAttribute('data-stop') });
        if (state.planPick) { selectPlanStop(stopEl.getAttribute('data-stop')); return; }
        openStopSheet(stopEl.getAttribute('data-stop'));
        return;
      }
      var vehEl = e.target.closest('[data-veh]');
      if (vehEl) {
        e.stopPropagation();
        KTA.evalTool.log('tap', { target: 'map-veh:' + vehEl.getAttribute('data-veh') });
        openVehicleSheet(vehEl.getAttribute('data-veh'));
        return;
      }
      var lineEl = e.target.closest('[data-route-line]');
      if (lineEl) { e.stopPropagation(); openRoute(lineEl.getAttribute('data-route-line')); }
    });
  }

  function zoomBy(factor) {
    var v = state.view;
    var cx = v.x + v.w / 2, cy = v.y + v.h / 2;
    var nw = Math.max(200, Math.min(1400, v.w * factor));
    var nh = nw * (v.h / v.w);
    v.x = cx - nw / 2; v.y = cy - nh / 2; v.w = nw; v.h = nh;
    state.mapViewFit = false;
    applyView();
  }

  /* ============================================================ SHEETS ==== */
  function openStopSheet(stopId) {
    var s = stopById(stopId);
    if (!s) return;
    var arrivals = KTA.sim.arrivalsForStop(stopId).slice(0, 3);
    var routes = KTA.sim.routesServingStop(stopId);
    var html =
      '<h3>' + esc(LANG === 'ur' ? s.ur : s.name) + '</h3>' +
      '<div class="row wrap" style="margin:6px 0 10px">' +
      '<span class="badge ' + (s.kind === 'informal' ? 'est' : 'neutral') + '">' +
      esc(s.kind === 'informal' ? t('stop.informal') : t('stop.formal')) + '</span>' +
      '<span class="badge neutral">' + esc(s.area) + '</span></div>' +
      '<div class="landmark" style="margin-bottom:12px">' + LAND(s.photo, LANG === 'ur' ? s.landmarkUr : s.landmark) + '</div>' +
      '<div class="muted" style="margin-bottom:4px">' + esc(t('stop.identify')) + '</div>' +
      '<div style="margin-bottom:12px;font-weight:600">' + esc(LANG === 'ur' ? s.landmarkUr : s.landmark) + '</div>' +
      '<div class="section-title">' + esc(t('stop.nextBuses')) + '</div>' +
      (arrivals.length ? arrivals.map(function (a) { return etaCardHtml(a, s); }).join('')
        : '<div class="empty">' + esc(t('stop.noBus')) + '</div>') +
      '<div class="section-title">' + esc(t('stop.serving')) + '</div>' +
      '<div class="chiprow">' + routes.map(function (r) {
        return '<button class="chip" data-route="' + r.id + '"><span class="routechip" style="background:' + routeChipColor(r) + ';min-width:36px;height:22px;font-size:.6875rem">' + esc(r.number) + '</span>' + esc(routeName(r)) + '</button>';
      }).join('') + '</div>' +
      '<div class="stack" style="margin-top:14px">' +
      '<button class="btn primary" data-openstop="' + stopId + '">' + esc(t('stop.planFrom')) + '</button>' +
      '</div>';
    openSheet(html, function (sheet) {
      sheet.querySelectorAll('[data-openstop]').forEach(function (b) {
        b.addEventListener('click', function () { closeSheet(); openStop(b.getAttribute('data-openstop')); });
      });
      sheet.querySelectorAll('[data-route]').forEach(function (b) {
        b.addEventListener('click', function () { closeSheet(); openRoute(b.getAttribute('data-route')); });
      });
    });
  }

  function openVehicleSheet(vehId) {
    var v = KTA.sim.vehicles().filter(function (x) { return x.id === vehId; })[0];
    if (!v) return;
    var r = routeById(v.routeId);
    var rating = KTA.sim.ratingFor(v.id);
    var prog = KTA.sim.routeProgress(v.routeId) || [];
    var me = prog.filter(function (p) { return p.vehicle.id === v.id; })[0] || {};
    var nextStopName = me.nextStop ? stopName(me.nextStop) : '—';
    var badge = v.live
      ? '<span class="badge live"><span class="pulse"></span>' + esc(t('eta.live')) + '</span>'
      : '<span class="badge est">' + esc(t('eta.estimated')) + '</span>';
    var html =
      '<div class="row" style="margin-bottom:8px">' +
      '<span class="routechip" style="background:' + routeChipColor(r) + '">' + esc(r.number) + '</span>' +
      '<div class="grow"><div style="font-weight:700">' + esc(routeName(r)) + '</div>' +
      '<div class="tiny muted">' + esc(v.plate) + ' · ' + esc(v.model) + '</div></div>' + badge + '</div>' +
      (v.status === 'out_of_service' ? '<div class="banner danger" style="margin-bottom:10px">' + ICON('alert', 16) + '<div>' + esc(t('eta.oos')) + '</div></div>' : '') +
      '<div class="kv"><span class="k">' + esc(t('route.driver')) + '</span><span>' + esc(LANG === 'ur' ? v.driver.ur : v.driver.name) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(t('route.nextStop')) + '</span><span>' + esc(nextStopName) + ' · ' + esc(fmtMin(me.etaToNext)) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(t('route.onboard')) + '</span><span>' + Math.round(v.occupancy * v.capacity) + ' / ' + v.capacity + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(t('route.ratingOf', { a: rating.avg ? rating.avg.toFixed(1) : '—', b: rating.count })) + '</span><span>' + STARS(rating.avg || 0, 15) + '</span></div>' +
      '<div class="stack" style="margin-top:14px">' +
      '<button class="btn" data-track="' + v.id + '">' + ICON('map', 18) + esc(t('home.track')) + '</button>' +
      '<button class="btn primary" data-review="' + v.id + '">' + ICON('star', 18) + esc(t('route.rateDriver')) + '</button>' +
      '<button class="btn ghost" data-report="' + v.id + '">' + ICON('flag', 18) + esc(t('safety.robbery')) + '</button>' +
      '</div>';
    openSheet(html, function (sheet) {
      sheet.querySelector('[data-track]').addEventListener('click', function () {
        closeSheet(); state.mapFocusRoute = v.routeId; go('map');
      });
      sheet.querySelector('[data-review]').addEventListener('click', function () { closeSheet(); openReviewSheet(v.id); });
      sheet.querySelector('[data-report]').addEventListener('click', function () { closeSheet(); openRobberySheet(v.id); });
    });
  }

  function openReviewSheet(vehId) {
    var v = KTA.sim.vehicles().filter(function (x) { return x.id === vehId; })[0];
    state.review = { vehicleId: vehId, rating: 0, tags: [], text: '' };
    var tagHtml = KTA.data.REVIEW_TAGS.map(function (tag) {
      return '<button class="tag" data-tag="' + tag.id + '">' + esc(LANG === 'ur' ? tag.ur : tag.en) + '</button>';
    }).join('');
    var html =
      '<h3>' + esc(t('review.title')) + '</h3>' +
      '<div class="muted" style="margin-bottom:8px">' + esc(LANG === 'ur' ? v.driver.ur : v.driver.name) + ' · ' + esc(v.plate) + '</div>' +
      '<div class="stars" id="revStars" style="justify-content:center;margin:6px 0 4px">' +
      [1, 2, 3, 4, 5].map(function (n) {
        return '<button class="star-btn" data-star="' + n + '" aria-label="' + n + '">' +
          '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-linejoin="round">' + KTA.assets.ICONS.star + '</svg></button>';
      }).join('') + '</div>' +
      '<div class="center muted" style="margin-bottom:12px">' + esc(t('review.tapStars')) + '</div>' +
      '<div class="section-title">' + esc(t('review.tags')) + '</div>' +
      '<div class="taglist" id="revTags" style="margin-bottom:12px">' + tagHtml + '</div>' +
      '<div class="field"><label>' + esc(t('review.text')) + ' (' + esc(t('common.optional')) + ')</label>' +
      '<textarea class="input" id="revText" rows="2"></textarea></div>' +
      '<button class="btn primary" id="revSubmit">' + esc(t('review.submit')) + '</button>';
    openSheet(html, function (sheet) {
      var stars = sheet.querySelector('#revStars');
      stars.addEventListener('click', function (e) {
        var b = e.target.closest('[data-star]');
        if (!b) return;
        state.review.rating = parseInt(b.getAttribute('data-star'), 10);
        paintStars(sheet);
      });
      sheet.querySelector('#revTags').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tag]');
        if (!b) return;
        var id = b.getAttribute('data-tag');
        var i = state.review.tags.indexOf(id);
        if (i === -1) state.review.tags.push(id); else state.review.tags.splice(i, 1);
        b.classList.toggle('on');
      });
      sheet.querySelector('#revSubmit').addEventListener('click', function () {
        if (!state.review.rating) { toast(t('review.tapStars')); return; }
        KTA.sim.submitReview({
          targetType: 'driver', targetId: vehId, author: 'You',
          rating: state.review.rating, tags: state.review.tags.slice(),
          text: sheet.querySelector('#revText').value.trim()
        });
        closeSheet();
        toast(t('review.thanks'));
        renderCurrent();
      });
      paintStars(sheet);
    });
  }

  function paintStars(sheet) {
    var btns = sheet.querySelectorAll('[data-star]');
    btns.forEach(function (b) {
      var n = parseInt(b.getAttribute('data-star'), 10);
      var svg = b.querySelector('svg');
      svg.setAttribute('fill', state.review.rating >= n ? '#f59e0b' : 'none');
    });
  }

  function openRobberySheet(prefillVehicle) {
    var html =
      '<h3>' + esc(t('safety.robbery')) + '</h3>' +
      '<form id="robberyForm">' +
      '<div class="field"><label for="rbSubject">' + esc(t('safety.subject')) + '</label>' +
      '<input class="input" id="rbSubject" name="subject" autocomplete="off" required></div>' +
      '<div class="field"><label for="rbDesc">' + esc(t('safety.desc')) + '</label>' +
      '<textarea class="input" id="rbDesc" name="description" rows="3" required></textarea></div>' +
      '<div class="field"><label for="rbVehicle">' + esc(t('safety.vehicle')) + '</label>' +
      '<select class="input" id="rbVehicle" name="vehicleId"><option value="">—</option>' +
      KTA.data.VEHICLES.filter(function (v) { return routeById(v.routeId).type === 'bus'; }).map(function (v) {
        var route = routeById(v.routeId);
        return '<option value="' + esc(v.id) + '"' + (prefillVehicle === v.id ? ' selected' : '') + '>' +
          esc(route.number + ' · ' + v.plate) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label for="rbEvidence">' + esc(t('safety.evidence')) + '</label>' +
      '<div class="attach-box"><input type="file" id="rbEvidence" name="evidence" accept="image/*" capture="environment" />' +
      '<div class="attach-meta" id="rbEvidenceMeta">No image attached</div></div></div>' +
      '<button class="btn danger" type="submit" id="rbSubmit" style="margin-top:12px">' + esc(t('safety.send')) + '</button></form>';
    openSheet(html, function (sheet) {
      var evidenceInput = sheet.querySelector('#rbEvidence');
      var evidenceMeta = sheet.querySelector('#rbEvidenceMeta');
      evidenceInput.addEventListener('change', function () {
        var file = evidenceInput.files && evidenceInput.files[0];
        evidenceMeta.textContent = file ? file.name : 'No image attached';
      });
      sheet.querySelector('#robberyForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var file = evidenceInput.files && evidenceInput.files[0];
        var evidenceText = file ? file.name : '';
        var selectedVehicle = sheet.querySelector('#rbVehicle').value || prefillVehicle || null;
        KTA.sim.submitReport({
          type: 'robbery', vehicleId: selectedVehicle,
          subject: sheet.querySelector('#rbSubject').value.trim(),
          description: sheet.querySelector('#rbDesc').value.trim(),
          evidence: evidenceText,
          location: { x: 520, y: 330, label: stopName('st_jpo') },
          source: 'commuter-app'
        });
        closeSheet();
        toast(t('safety.sentShort'));
        renderSafety();
      });
    });
  }

  /* ========================================================== ROUTES ====== */
  function renderRoutes() {
    var host = $id('routeList');
    var q = state.routeQuery.trim().toLowerCase();
    var list = KTA.data.ROUTES.filter(function (r) {
      if (state.routeFilter !== 'all' && r.type !== state.routeFilter) return false;
      if (!q) return true;
      return r.number.toLowerCase().indexOf(q) !== -1 || r.name.toLowerCase().indexOf(q) !== -1 ||
        r.ur.indexOf(state.routeQuery) !== -1;
    });
    $id('routeFilters').innerHTML = [['all', t('routes.all')], ['bus', t('routes.bus')], ['chinchi', t('routes.chinchi')]]
      .map(function (o) {
        return '<button class="chip' + (state.routeFilter === o[0] ? ' on' : '') + '" data-routefilter="' + o[0] + '">' + esc(o[1]) + '</button>';
      }).join('');
    $id('routesSub').textContent = list.length + ' ' + (LANG === 'ur' ? 'روٹس' : 'routes');
    host.innerHTML = list.map(function (r) {
      var arr = KTA.sim.nextArrival(r.id, r.stopIds[0]);
      var live = r.track === 'live';
      return '<button class="routecard" data-route="' + r.id + '">' +
        '<span class="routechip" style="background:' + routeChipColor(r) + '">' + esc(r.number) + '</span>' +
        '<span class="rc-main"><span class="rc-name">' + esc(routeName(r)) + '</span>' +
        '<span class="rc-sub">' + (r.type === 'bus' ? ICON('bus', 13) : ICON('rickshaw', 13)) +
        esc(r.stopIds.length + ' ' + t('common.stops')) + ' · ' + esc(r.fare + ' PKR') + ' · ' +
        (live ? '<span class="badge live">' + esc(t('eta.live')) + '</span>' : '<span class="badge est">' + esc(t('eta.estimated')) + '</span>') +
        '</span></span>' +
        '<span class="rc-eta">' + (arr
          ? '<span class="n">' + (arr.minutes < 0.7 ? '•' : Math.round(arr.minutes)) + '</span><span class="u">' + esc(t('common.min')) + '</span>'
          : '<span class="n">—</span>') + '</span></button>';
    }).join('') || '<div class="empty">' + esc(LANG === 'ur' ? 'کوئی روٹ نہیں' : 'No routes match') + '</div>';
  }

  function openRoute(routeId) {
    state.currentRoute = routeId;
    go('route');
  }

  function renderRouteDetail() {
    var r = routeById(state.currentRoute);
    if (!r) return;
    $id('routeTitle').textContent = r.number + ' · ' + routeName(r);
    $id('routeSub').textContent = r.operator;
    $id('btnRouteMap').innerHTML = ICON('map', 20);

    var prog = KTA.sim.routeProgress(r.id) || [];
    var body = '';

    if (r.track !== 'live') {
      body += '<div class="banner info" style="margin-bottom:12px">' + ICON('alert', 16) +
        '<div>' + esc(t('routes.noTracker')) + '</div></div>';
    }

    /* live vehicles on the route */
    body += '<div class="section-title">' + esc(t('routes.liveBus')) + '</div>';
    body += prog.length ? prog.map(function (p) {
      var v = p.vehicle;
      var badge = v.live ? '<span class="badge live"><span class="pulse"></span>' + esc(t('eta.live')) + '</span>'
        : '<span class="badge est">' + esc(t('eta.estimated')) + '</span>';
      var statusBadge = v.status === 'out_of_service' ? '<span class="badge oos">' + esc(t('eta.oos')) + '</span>'
        : (v.status === 'delayed' ? '<span class="badge est">' + esc(t('eta.delayed', { n: v.delayMin })) + '</span>' : '');
      return '<div class="vehiclecard" data-veh="' + v.id + '" style="cursor:pointer">' +
        '<div class="row" style="margin-bottom:6px">' +
        '<span class="routechip" style="background:' + routeChipColor(r) + '">' + esc(r.number) + '</span>' +
        '<div class="grow"><div style="font-weight:600">' + esc(v.plate) + '</div>' +
        '<div class="tiny muted">' + esc(v.model) + '</div></div>' + badge + '</div>' +
        '<div class="row wrap" style="gap:6px;margin-bottom:6px">' + statusBadge +
        '<span class="badge neutral">' + esc(t('route.nextStop')) + ': ' + esc(p.nextStop ? stopName(p.nextStop) : '—') + '</span>' +
        '<span class="badge neutral">' + esc(fmtMin(p.etaToNext)) + '</span></div>' +
        '<div class="tiny muted">' + esc(t('route.driver')) + ': ' + esc(LANG === 'ur' ? v.driver.ur : v.driver.name) + ' · ' + esc(v.plate) + '</div>' +
        '</button>';
    }).join('') : '<div class="empty">' + esc(t('stop.noBus')) + '</div>';

    /* stop list with ETAs */
    body += '<div class="section-title">' + esc(t('routes.stopsOn')) + '</div><div class="card" style="padding:6px 12px">';
    r.stopIds.forEach(function (sid) {
      var s = stopById(sid);
      var arr = KTA.sim.arrivalsForStop(sid).filter(function (a) { return a.routeId === r.id; })[0];
      body += '<div class="stoprow" data-stop="' + sid + '" style="cursor:pointer">' +
        '<span class="sdot' + (s.kind === 'informal' ? ' informal' : '') + '"></span>' +
        '<span class="grow"><span class="sname">' + esc(LANG === 'ur' ? s.ur : s.name) + '</span>' +
        '<span class="ssub">' + esc(s.area) + (s.kind === 'informal' ? ' · ' + esc(LANG === 'ur' ? s.landmarkUr : s.landmark) : '') + '</span></span>' +
        '<span class="seta">' + (arr
          ? '<span style="font-weight:600">' + (arr.minutes < 0.7 ? esc(t('common.now')) : Math.round(arr.minutes) + ' ' + esc(t('common.min'))) + '</span>' +
          '<span class="tiny muted" style="display:block">' + (arr.live ? esc(t('eta.live')) : esc(t('eta.estimated'))) + '</span>'
          : '<span class="tiny muted">—</span>') + '</span></div>';
    });
    body += '</div>';

    /* route facts + driver reviews */
    body += '<div class="section-title">' + esc(t('routes.operator')) + '</div>' +
      '<div class="card"><div class="kv"><span class="k">' + esc(t('routes.operator')) + '</span><span>' + esc(r.operator) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(t('routes.fare')) + '</span><span>' + esc(r.fare + ' PKR') + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(t('routes.every', { n: r.headwayMin })) + '</span><span>' + esc(r.type === 'bus' ? t('routes.bus') : t('routes.chinchi')) + '</span></div></div>';

    body += '<div class="section-title">' + esc(t('route.reviews')) + '</div>' + renderReviewsBlock(r.id);

    $id('routeBody').innerHTML = body;
  }

  function renderReviewsBlock(routeId) {
    var r = routeById(routeId);
    var vehicles = KTA.data.VEHICLES.filter(function (v) { return v.routeId === routeId; });
    var html = '';
    vehicles.forEach(function (v) {
      var rating = KTA.sim.ratingFor(v.id);
      var reviews = KTA.sim.reviewsFor(v.id);
      html += '<div class="card"><div class="row between" style="margin-bottom:6px">' +
        '<div><div style="font-weight:600">' + esc(LANG === 'ur' ? v.driver.ur : v.driver.name) + '</div>' +
        '<div class="tiny muted">' + esc(v.plate) + ' · ' + esc(v.model) + '</div></div>' +
        '<div class="center">' + STARS(rating.avg || 0, 15) +
        '<div class="tiny muted">' + esc(t('route.ratingOf', { a: rating.avg ? rating.avg.toFixed(1) : '—', b: rating.count })) + '</div></div>' +
        '</div>';
      if (reviews.length) {
        html += '<ul class="list">' + reviews.slice(0, 3).map(function (rv) {
          return '<li><div class="row" style="justify-content:space-between">' +
            '<span style="font-size:.8125rem;font-weight:600">' + esc(rv.author) + '</span>' +
            '<span class="tiny muted">' + STARS(rv.rating, 12) + '</span></div>' +
            '<div class="tiny" style="color:var(--ink-2)">' + esc(rv.text || '') + '</div>' +
            (rv.tags && rv.tags.length ? '<div class="tiny muted">' + esc(rv.tags.join(' · ')) + '</div>' : '') +
            '</li>';
        }).join('') + '</ul>';
      } else {
        html += '<div class="tiny muted">' + esc(t('route.noReviews')) + '</div>';
      }
      html += '<button class="btn compact" data-review="' + v.id + '" style="margin-top:8px">' +
        ICON('star', 15) + esc(t('route.rateDriver')) + '</button></div>';
    });
    return html;
  }

  /* ============================================================ STOP ====== */
  function openStop(stopId) {
    state.currentStop = stopId;
    go('stop');
  }

  function renderStopDetail() {
    var s = stopById(state.currentStop);
    if (!s) return;
    $id('stopTitle').textContent = LANG === 'ur' ? s.ur : s.name;
    $id('stopSub').textContent = s.area + ' · ' + (s.kind === 'informal' ? t('stop.informal') : t('stop.formal'));

    var arrivals = KTA.sim.arrivalsForStop(s.id);
    var routes = KTA.sim.routesServingStop(s.id);
    var html = '';

    html += '<div class="landmark" style="margin-bottom:12px">' + LAND(s.photo, LANG === 'ur' ? s.landmarkUr : s.landmark) + '</div>';
    html += '<div class="card"><div class="section-title" style="margin-top:0">' + esc(t('stop.identify')) + '</div>' +
      '<div style="font-weight:600">' + esc(LANG === 'ur' ? s.landmarkUr : s.landmark) + '</div>' +
      '<div class="tiny muted" style="margin-top:4px">' + esc(s.area) + ' · ' +
      esc(s.kind === 'informal' ? t('stop.informal') : t('stop.formal')) + '</div></div>';

    html += '<div class="section-title">' + esc(t('stop.nextBuses')) + '</div>';
    html += arrivals.length ? arrivals.slice(0, 6).map(function (a) { return etaCardHtml(a, s); }).join('')
      : '<div class="empty">' + esc(t('stop.noBus')) + '</div>';

    html += '<div class="section-title">' + esc(t('stop.serving')) + '</div><div class="chiprow">' +
      routes.map(function (r) {
        return '<button class="chip" data-route="' + r.id + '"><span class="routechip" style="background:' + routeChipColor(r) + ';min-width:36px;height:22px;font-size:.6875rem">' + esc(r.number) + '</span>' + esc(routeName(r)) + '</button>';
      }).join('') + '</div>';

    html += '<div class="stack" style="margin-top:16px">' +
      '<button class="btn primary" data-planfrom="' + s.id + '">' + ICON('plan', 18) + esc(t('stop.planFrom')) + '</button></div>';

    $id('stopBody').innerHTML = html;
  }

  /* ============================================================= PLAN ====== */
  function renderPlan() {
    var sug = KTA.data.PLANS.slice(0, 4);
    $id('planSuggestions').innerHTML = sug.map(function (p) {
      return '<button class="chip" data-planpair="' + p.from + '|' + p.to + '">' +
        esc(stopName(p.from)) + ' → ' + esc(stopName(p.to)) + '</button>';
    }).join('');

    $id('planFrom').textContent = state.planFrom ? stopName(state.planFrom) : t('plan.chooseMap');
    $id('planTo').textContent = state.planTo ? stopName(state.planTo) : t('plan.chooseMap');
    $id('btnSwap').setAttribute('aria-label', t('plan.swap'));

    renderPlanResult();
  }

  function selectPlanStop(stopId) {
    if (state.planPick === 'from') state.planFrom = stopId;
    else if (state.planPick === 'to') state.planTo = stopId;
    state.planPick = null;
    state.planResult = null;
    go('plan');
  }

  function renderPlanResult() {
    var host = $id('planResult');
    var p = state.planResult;
    if (!p) { host.innerHTML = ''; return; }
    var steps = p.steps.map(function (st, i) {
      var marker = '<span class="marker">' + ICON(st.kind === 'board' ? 'bus' : (st.kind === 'walk' ? 'walk' : 'swap'), 20) + '</span>';
      var title = '', sub = '';
      if (st.kind === 'board') {
        var r = routeById(st.routeId);
        title = (LANG === 'ur' ? 'سوار ہوں' : 'Board') + ' ' + r.number + ' · ' + stopName(st.fromStop);
        sub = (LANG === 'ur' ? 'اتریں' : 'Get off') + ': ' + stopName(st.toStop) + ' · ' + st.min + ' ' + t('common.min') + ' · ' + st.fare + ' PKR';
      } else if (st.kind === 'transfer') {
        marker = '<span class="marker transfer">' + ICON('swap', 20) + '</span>';
        title = (LANG === 'ur' ? 'گاڑی تبدیل کریں' : 'Change vehicle') + ' · ' + stopName(st.atStop);
        sub = st.min + ' ' + t('common.min') + ' ' + (LANG === 'ur' ? 'انتظار' : 'wait');
      } else {
        marker = '<span class="marker walk">' + ICON('walk', 20) + '</span>';
        title = (LANG === 'ur' ? 'پیدل' : 'Walk') + ' → ' + stopName(st.toStop);
        sub = st.min + ' ' + t('common.min');
      }
      var why = LANG === 'ur' ? st.reasonUr : st.reasonEn;
      return '<div class="step">' + marker +
        '<div class="grow"><div class="ttl">' + esc(title) + '</div>' +
        '<div class="sub">' + esc(sub) + '</div>' +
        '<div class="why">' + esc(why) + '</div></div></div>';
    }).join('');

    host.innerHTML = '<div class="section-title">' + esc(stopName(p.from) + ' → ' + stopName(p.to)) + '</div>' +
      '<div class="card" style="margin-bottom:12px"><div class="row between">' +
      '<div><div class="tiny muted">' + esc(t('plan.total')) + '</div><div style="font-size:1.25rem;font-weight:700">' + esc(p.totalMin + ' ' + t('common.min')) + '</div></div>' +
      '<div class="center"><div class="tiny muted">' + esc(t('plan.fare')) + '</div><div style="font-size:1.25rem;font-weight:700">' + esc(p.cost + ' PKR') + '</div></div>' +
      '<div class="center"><div class="tiny muted">' + esc(t('plan.step', { n: p.steps.length })) + '</div><div style="font-size:1.25rem;font-weight:700">' + p.steps.length + '</div></div>' +
      '</div></div>' + steps +
      '<button class="btn primary" id="btnStartJourney" style="margin-top:12px">' + ICON('plan', 18) + esc(t('plan.start')) + '</button>';
    var b = $id('btnStartJourney');
    if (b) b.addEventListener('click', function () {
      var first = p.steps.filter(function (s) { return s.kind === 'board'; })[0];
      state.mapFocusRoute = first ? first.routeId : null;
      toast(t('plan.started'));
      go('map');
    });
  }

  /* =========================================================== SAFETY ====== */
  function renderSafety() {
    var host = $id('safetyBody');
    var s = state.sos;
    var html = '';

    if (s.phase === 'countdown') {
      html += '<div class="card center" style="margin-top:8px">' +
        '<div class="muted" style="margin-bottom:8px">' + esc(t('safety.countdown', { n: s.countdown })) + '</div>' +
        '<div class="countdown" id="sosCount">' + s.countdown + '</div>' +
        '<div class="tiny muted" style="margin-top:8px">' + esc(t('safety.sentBody')) + '</div>' +
        '<button class="btn danger" id="btnCancelSos" style="margin-top:16px">' + ICON('close', 18) + esc(t('safety.cancelSend')) + '</button>' +
        '</div>';
    } else if (s.phase === 'sent') {
      html += '<div class="card center" style="margin-top:8px">' +
        '<div style="color:var(--ok)">' + ICON('check', 40) + '</div>' +
        '<h3 style="margin-top:8px">' + esc(t('safety.sent')) + '</h3>' +
        '<p>' + esc(t('safety.sentBody')) + '</p>' +
        '<div class="tiny muted">' + esc(stopName('st_jpo')) + ' · ' + esc(new Date().toLocaleTimeString()) + '</div>' +
        '<button class="btn" id="btnSafetyBack2" style="margin-top:14px">' + esc(t('common.done')) + '</button>' +
        '</div>';
    } else {
      html += '<div class="sos-wrap">' +
        '<button class="sos-btn" id="sosBtn">' + ICON('sos', 30) + '<span>' + esc(t('safety.hold')) + '</span><small>2 s</small></button>' +
        '<svg class="sos-ring" viewBox="0 0 200 200"><circle id="sosRing" cx="100" cy="100" r="96" stroke-dasharray="603" stroke-dashoffset="603"></circle></svg>' +
        '</div>' +
        '<div class="center muted" style="margin-bottom:16px">' + esc(t('safety.holdHelp')) + '</div>' +
        '<button class="btn ghost" id="btnRobbery">' + ICON('flag', 18) + esc(t('safety.robbery')) + '</button>' +
        '<div class="section-title">' + esc(t('safety.myReports')) + '</div>' +
        renderReportsList();
    }
    host.innerHTML = html;

    var sb = $id('sosBtn');
    if (sb) bindSosButton(sb);
    var cb = $id('btnCancelSos');
    if (cb) cb.addEventListener('click', cancelSos);
    var rb = $id('btnRobbery');
    if (rb) rb.addEventListener('click', function () { openRobberySheet(null); });
    var sb2 = $id('btnSafetyBack2');
    if (sb2) sb2.addEventListener('click', function () { state.sos.phase = 'idle'; renderSafety(); });
  }

  function renderReportsList() {
    var reps = KTA.sim.reports();
    if (!reps.length) return '<div class="empty">' + esc(LANG === 'ur' ? 'کوئی رپورٹ نہیں' : 'No reports yet') + '</div>';
    return reps.slice(0, 4).map(function (r) {
      var kind = r.type === 'sos' ? 'SOS' : 'Complaint';
      return '<div class="card" style="padding:10px"><div class="row between">' +
        '<span style="font-weight:600;font-size:.84375rem">' + esc(r.type === 'sos' ? kind : (r.subject || t('safety.robbery'))) + '</span>' +
        '<span class="badge ' + (r.type === 'sos' ? 'oos' : 'info') + '">' + esc(t('safety.sent')) + '</span></div>' +
        (r.type === 'robbery' ? '<div class="tiny" style="margin-top:4px">' + esc(r.description || '') +
          (r.evidence ? '<div class="tiny muted">' + esc(t('safety.evidence')) + ': ' + esc(r.evidence) + '</div>' : '') + '</div>' : '') +
        '<div class="tiny muted">' + esc(r.location ? r.location.label : '') + ' · ' + esc(new Date(r.at).toLocaleTimeString()) + '</div></div>';
    }).join('');
  }

  function bindSosButton(btn) {
    var ring = $id('sosRing');
    var CIRC = 603;
    var dur = 2000;

    function tick() {
      if (!state.sos.startTs) return;
      var p = Math.min(1, (Date.now() - state.sos.startTs) / dur);
      ring.setAttribute('stroke-dashoffset', String(CIRC * (1 - p)));
      if (p >= 1) {
        state.sos.startTs = 0;
        clearInterval(state.sos.timer);
        startCountdown();
      }
    }

    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (state.sos.phase !== 'idle') return;
      state.sos.startTs = Date.now();
      state.sos.timer = setInterval(tick, 30);
      KTA.evalTool.log('tap', { target: 'sos:hold-start' });
    });

    /* releasing anywhere ends the hold: a short press never sends anything */
    function release() {
      if (state.sos.phase !== 'idle' || !state.sos.startTs) return;
      clearInterval(state.sos.timer);
      state.sos.startTs = 0;
      var ringEl = $id('sosRing');
      if (ringEl) ringEl.setAttribute('stroke-dashoffset', String(CIRC));
      toast(t('safety.aborted'));
      KTA.evalTool.log('error', { text: 'SOS hold released too early' });
    }
    window.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
  }

  function startCountdown() {
    state.sos.phase = 'countdown';
    state.sos.countdown = 5;
    renderSafety();
    KTA.evalTool.log('tap', { target: 'sos:countdown' });
    state.sos.timer = setInterval(function () {
      state.sos.countdown -= 1;
      var c = $id('sosCount');
      if (c) c.textContent = state.sos.countdown;
      if (state.sos.countdown <= 0) {
        clearInterval(state.sos.timer);
        state.sos.phase = 'sent';
        KTA.sim.submitReport({
          type: 'sos', anonymous: false,
          location: { x: 520, y: 330, label: stopName('st_jpo') },
          source: 'commuter-app', note: 'Emergency SOS'
        });
        renderSafety();
      }
    }, 1000);
  }

  function cancelSos() {
    clearInterval(state.sos.timer);
    state.sos.phase = 'idle';
    state.sos.countdown = 5;
    KTA.evalTool.log('tap', { target: 'sos:cancel' });
    renderSafety();
    toast(t('safety.canceled'));
  }

  /* ============================================================= MORE ====== */
  function renderMore() {
    var s = KTA.store.read().settings;
    var html = '';

    html += '<div class="card"><div class="section-title" style="margin-top:0">' + esc(t('more.language')) + '</div>' +
      '<div class="chiprow">' +
      '<button type="button" class="chip' + (s.lang === 'en' ? ' on' : '') + '" data-lang="en" aria-pressed="' + (s.lang === 'en') + '">' + esc(t('more.english')) + '</button>' +
      '<button type="button" class="chip' + (s.lang === 'ur' ? ' on' : '') + '" data-lang="ur" aria-pressed="' + (s.lang === 'ur') + '">' + esc(t('more.urdu')) + '</button>' +
      '</div><div class="tiny muted" style="margin-top:8px">' + esc(t('app.name')) + '</div></div>';

    html += '<div class="card"><div class="section-title" style="margin-top:0">' + esc(t('more.access')) + '</div>' +
      '<button type="button" class="switch' + (s.lightMode ? ' on' : '') + '" role="switch" aria-checked="' + !!s.lightMode + '" data-setting="lightMode"><span>' + esc(t('more.lightMode')) + '</span><span class="track"></span></button>' +
      '<button type="button" class="switch' + (s.largeText ? ' on' : '') + '" role="switch" aria-checked="' + !!s.largeText + '" data-setting="largeText"><span>' + esc(t('more.largeText')) + '</span><span class="track"></span></button>' +
      '<button type="button" class="switch' + (s.contrast ? ' on' : '') + '" role="switch" aria-checked="' + !!s.contrast + '" data-setting="contrast"><span>' + esc(t('more.contrast')) + '</span><span class="track"></span></button>' +
      '</div>';

    html += '<div class="card"><div class="section-title" style="margin-top:0">' + esc(t('more.clock')) + '</div>' +
      '<div class="chiprow">' + [[1, '1×'], [4, '4×'], [12, '12×']].map(function (o) {
        return '<button type="button" class="chip' + (s.clockFactor === o[0] ? ' on' : '') + '" data-clock="' + o[0] + '" aria-pressed="' + (s.clockFactor === o[0]) + '">' + o[1] + '</button>';
      }).join('') + '</div><div class="tiny muted" style="margin-top:8px">' + esc(t('more.clockNote')) + '</div></div>';

    html += '<div class="card"><div class="section-title" style="margin-top:0">' + esc(t('eta.offline')) + '</div>' +
      '<button type="button" class="switch' + (s.offline ? ' on' : '') + '" role="switch" aria-checked="' + !!s.offline + '" data-setting="offline"><span>' + esc(t('more.offline')) + '</span><span class="track"></span></button>' +
      '<div class="tiny muted" style="margin-top:6px">' + esc(t('more.offlineNote')) + '</div></div>';

    html += '<div class="card"><div class="section-title" style="margin-top:0">' + esc(t('more.evalMode')) + '</div>' +
      '<button type="button" class="switch' + (KTA.evalTool.isEnabled() ? ' on' : '') + '" role="switch" aria-checked="' + KTA.evalTool.isEnabled() + '" data-setting="evalMode"><span>' + esc(t('more.evalMode')) + '</span><span class="track"></span></button>' +
      '<div class="tiny muted" style="margin-top:6px">' + esc(t('more.evalHint')) + '</div></div>';

    html += '<div class="card"><div class="section-title" style="margin-top:0">' + esc(t('more.about')) + '</div>' +
      '<div class="tiny">' + esc(t('more.aboutBody')) + '</div></div>';

    html += '<button class="btn ghost" id="btnReset">' + ICON('refresh', 18) + esc(t('more.reset')) + '</button>';

    $id('moreBody').innerHTML = html;
  }

  /* =========================================================== ALERTS ====== */
  function renderAlerts() {
    var alerts = KTA.sim.alerts();
    $id('alertsSub').textContent = alerts.length + (LANG === 'ur' ? ' الرٹس' : ' alerts');
    $id('alertsBody').innerHTML = alerts.length ? alerts.map(function (a) {
      var sev = a.severity === 'out_of_service' ? 'danger' : 'info';
      var mins = Math.max(1, Math.round((Date.now() - a.at) / 60000));
      return '<div class="banner ' + sev + '" style="margin-bottom:10px">' + ICON('alert', 18) +
        '<div class="grow"><strong>' + esc(a.routeNumber + ' · ' + (LANG === 'ur' ? a.routeNameUr : a.routeName)) + '</strong>' +
        esc(LANG === 'ur' ? a.messageUr : a.message) +
        '<div class="tiny" style="opacity:.8;margin-top:4px">' + esc(t('alerts.recent', { n: mins })) + '</div></div></div>';
    }).join('') : '<div class="empty">' + esc(t('alerts.none')) + '</div>';
  }

  /* ============================================================= TABS ====== */
  function renderTabs() {
    var tabs = [
      ['home', 'tab.home', 'home'], ['map', 'tab.map', 'map'], ['routes', 'tab.routes', 'routes'],
      ['plan', 'tab.plan', 'plan'], ['more', 'tab.more', 'more']
    ];
    $id('tabbar').innerHTML = tabs.map(function (x) {
      return '<button type="button" data-tab="' + x[0] + '">' + ICON(x[2], 22) + '<span>' + esc(t(x[1])) + '</span></button>';
    }).join('');
  }

  /* ====================================================== EVAL PANEL ====== */
  function renderEvalPanel() {
    var host = $id('evalPanel');
    if (!KTA.evalTool.isEnabled()) { host.innerHTML = ''; return; }
    var tasks = KTA.evalTool.TASKS;
    var cur = null;
    try { cur = JSON.parse(localStorage.getItem('kta_eval_v1') || '{}').currentTask; } catch (e) {}
    host.innerHTML = '<div class="evalbox"><div class="title"><span>EVAL</span>' +
      '<span>' + (cur ? 'task ' + cur : 'no task') + '</span></div>' +
      '<div class="row">' + tasks.map(function (tk) {
        return '<button data-evaltask="' + tk.id + '" class="' + (cur === tk.id ? 'on' : '') + '">' + tk.id + '</button>';
      }).join('') +
      '<button data-evalend="1">end</button><button data-evalnote="1">note</button>' +
      '<button data-evaljson="1">JSON</button><button data-evalcsv="1">CSV</button>' +
      '<button data-evalstop="1">stop</button></div>' +
      '<div class="hint">' + esc(cur ? (tasks.filter(function (x) { return x.id === cur; })[0] || {}).prompt : 'Pick a task to start timing.') + '</div>' +
      '</div>';
  }

  /* ======================================================= RENDER ALL ====== */
  function renderScreen(screen) {
    switch (screen) {
      case 'home': renderHome(); break;
      case 'routes': renderRoutes(); break;
      case 'route': renderRouteDetail(); break;
      case 'stop': renderStopDetail(); break;
      case 'plan': renderPlan(); break;
      case 'safety': renderSafety(); break;
      case 'more': renderMore(); break;
      case 'alerts': renderAlerts(); break;
      case 'map': renderMap(); break;
    }
  }

  function renderCurrent() { renderScreen(state.screen); }

  function refreshDynamic() {
    var sc = document.querySelector('.screen.active');
    var top = sc ? sc.scrollTop : 0;
    if (state.screen === 'home') { renderHomeNearby(); renderHomeAlerts(); renderOfflineBanner(); }
    if (state.screen === 'routes') renderRoutes();
    if (state.screen === 'route') renderRouteDetail();
    if (state.screen === 'stop') renderStopDetail();
    if (state.screen === 'map') { updateMapVehicles(); renderMapBanner(); }
    if (state.screen === 'alerts') renderAlerts();
    if (sc) sc.scrollTop = top;
    $id('sbClock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* =========================================================== EVENTS ====== */
  function bindEvents() {
    /* tabs */
    $id('tabbar').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      KTA.evalTool.log('tap', { target: 'tab:' + b.getAttribute('data-tab') });
      go(b.getAttribute('data-tab'));
    });

    /* generic delegation for data- attributes */
    document.addEventListener('click', function (e) {
      var el;

      el = e.target.closest('[data-route]');
      if (el) { KTA.evalTool.log('tap', { target: 'route:' + el.getAttribute('data-route') }); openRoute(el.getAttribute('data-route')); return; }

      el = e.target.closest('[data-stop]');
      if (el && !el.classList.contains('screen')) {
        KTA.evalTool.log('tap', { target: 'stop:' + el.getAttribute('data-stop') });
        if (state.planPick) { selectPlanStop(el.getAttribute('data-stop')); return; }
        openStop(el.getAttribute('data-stop')); return;
      }

      el = e.target.closest('[data-review]');
      if (el) { openReviewSheet(el.getAttribute('data-review')); return; }

      el = e.target.closest('[data-veh]');
      if (el) { KTA.evalTool.log('tap', { target: 'veh:' + el.getAttribute('data-veh') }); openVehicleSheet(el.getAttribute('data-veh')); return; }

      el = e.target.closest('[data-place]');
      if (el) { var pl = KTA.data.PLACES.filter(function (p) { return p.id === el.getAttribute('data-place'); })[0]; if (pl) openStop(pl.stopId); return; }

      el = e.target.closest('[data-routefilter]');
      if (el) { state.routeFilter = el.getAttribute('data-routefilter'); renderRoutes(); return; }

      el = e.target.closest('[data-mapfilter]');
      if (el) {
        var f = el.getAttribute('data-mapfilter');
        if (f === 'all') { state.mapFocusRoute = null; setMapRoutes(null); }
        else if (f === 'bus') setMapRoutes(routeIdsOfType('bus'));
        else setMapRoutes(routeIdsOfType('chinchi'));
        return;
      }

      el = e.target.closest('[data-maproute]');
      if (el) { toggleMapRoute(el.getAttribute('data-maproute')); return; }

      el = e.target.closest('[data-mapfocus]');
      if (el) { state.mapFocusRoute = null; applyMapFilter(); updateMapVehicles(); renderMapChips(); return; }

      el = e.target.closest('[data-open-alert]');
      if (el) { go('alerts'); return; }

      el = e.target.closest('[data-planpair]');
      if (el) {
        var parts = el.getAttribute('data-planpair').split('|');
        state.planFrom = parts[0]; state.planTo = parts[1];
        state.planResult = KTA.sim.findPlan(parts[0], parts[1]);
        renderPlan();
        return;
      }

      el = e.target.closest('[data-plan-pick]');
      if (el) {
        state.planPick = el.getAttribute('data-plan-pick');
        state.mapFocusRoute = null;
        state.view = { x: 0, y: 0, w: 1000, h: 640 };
        state.mapViewInitialized = true;
        state.mapViewFit = false;
        setMapRoutes(null);
        go('map');
        return;
      }

      el = e.target.closest('[data-plan-cancel]');
      if (el) {
        state.planPick = null;
        go('plan');
        return;
      }

      el = e.target.closest('[data-planfrom]');
      if (el) { state.planFrom = el.getAttribute('data-planfrom'); state.planResult = null; go('plan'); return; }

      el = e.target.closest('[data-lang]');
      if (el) { switchLang(el.getAttribute('data-lang')); return; }

      el = e.target.closest('[data-setting]');
      if (el) { toggleSetting(el.getAttribute('data-setting'), el); return; }

      el = e.target.closest('[data-clock]');
      if (el) {
        KTA.store.update(function (st) { st.settings.clockFactor = parseInt(el.getAttribute('data-clock'), 10); });
        renderMore();
        return;
      }

      el = e.target.closest('[data-evaltask]');
      if (el) {
        var id = el.getAttribute('data-evaltask');
        var cur = null;
        try { cur = JSON.parse(localStorage.getItem('kta_eval_v1') || '{}').currentTask; } catch (err) {}
        if (cur === id) KTA.evalTool.endTask(id); else { KTA.evalTool.startTask(id); }
        renderEvalPanel();
        return;
      }
      if (e.target.closest('[data-evalend]')) {
        var c = null;
        try { c = JSON.parse(localStorage.getItem('kta_eval_v1') || '{}').currentTask; } catch (err) {}
        if (c) KTA.evalTool.endTask(c);
        renderEvalPanel();
        return;
      }
      if (e.target.closest('[data-evalnote]')) {
        var note = window.prompt('Observation note');
        if (note) KTA.evalTool.note(note);
        return;
      }
      if (e.target.closest('[data-evaljson]')) { KTA.evalTool.download('json'); return; }
      if (e.target.closest('[data-evalcsv]')) { KTA.evalTool.download('csv'); return; }
      if (e.target.closest('[data-evalstop]')) { KTA.evalTool.disable(); renderEvalPanel(); toast('Evaluation mode off'); return; }
    });

    /* specific buttons */
    $id('btnLangQuick').addEventListener('click', function () { switchLang(LANG === 'en' ? 'ur' : 'en'); });
    $id('qaPlan').addEventListener('click', function () { go('plan'); });
    $id('qaSos').addEventListener('click', function () { go('safety'); });
    $id('qaRobbery').addEventListener('click', function () { openRobberySheet(null); });
    $id('qaTrack').addEventListener('click', function () { go('map'); });
    $id('btnRouteBack').addEventListener('click', back);
    $id('btnStopBack').addEventListener('click', back);
    $id('btnSafetyBack').addEventListener('click', back);
    $id('btnAlertsBack').addEventListener('click', back);
    $id('btnMapAlerts').addEventListener('click', function () { go('alerts'); });
    $id('btnRouteMap').addEventListener('click', function () {
      state.mapFocusRoute = state.currentRoute;
      go('map');
    });
    $id('mapIn').addEventListener('click', function () { zoomBy(0.8); });
    $id('mapOut').addEventListener('click', function () { zoomBy(1.25); });
    $id('mapFit').addEventListener('click', fitMapToViewport);
    window.addEventListener('resize', function () {
      if (state.screen === 'map' && state.mapViewFit) fitMapToViewport();
    });
    $id('btnSwap').addEventListener('click', function () {
      var f = state.planFrom, to = state.planTo;
      state.planFrom = to; state.planTo = f;
      state.planResult = null;
      renderPlan();
    });
    $id('btnPlan').addEventListener('click', function () {
      var from = state.planFrom;
      var to = state.planTo;
      if (!from || !to) { toast(t('plan.noPlan')); return; }
      state.planFrom = from; state.planTo = to;
      var plan = KTA.sim.findPlan(from, to);
      state.planResult = plan;
      if (!plan) { $id('planResult').innerHTML = '<div class="empty">' + esc(t('plan.noPlan')) + '</div>'; return; }
      renderPlanResult();
    });
    /* search */
    $id('q').addEventListener('input', function () { renderSearchResults($id('q').value); });
    $id('qRoutes').addEventListener('input', function () { state.routeQuery = $id('qRoutes').value; renderRoutes(); });

    /* sheet close — stop propagation so sheet buttons do not double-fire the
       document-level delegation */
    $id('scrim').addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target === $id('scrim')) closeSheet();
    });

    /* reset button lives inside a dynamically rendered card */
    document.addEventListener('click', function (e) {
      if (e.target.closest('#btnReset')) {
        if (window.confirm(t('more.resetConfirm'))) { KTA.store.reset(); renderCurrent(); toast(t('more.reset')); }
      }
    });
  }

  function switchLang(l) {
    LANG = KTA.i18n.setLang(l);
    KTA.i18n.apply();
    renderTabs();
    updateTabs();
    renderCurrent();
    renderEvalPanel();
    if (state.screen === 'map') { $id('mapSvg').removeAttribute('data-built'); renderMap(); }
    toast(l === 'ur' ? 'زبان: اردو' : 'Language: English');
  }

  function toggleSetting(key, el) {
    if (key === 'evalMode') {
      if (KTA.evalTool.isEnabled()) { KTA.evalTool.disable(); } else { KTA.evalTool.enable(); }
      renderEvalPanel(); renderMore();
      return;
    }
    if (key === 'offline') {
      KTA.store.update(function (st) {
        st.settings.offline = !st.settings.offline;
        st.settings.offlineSince = st.settings.offline ? Date.now() : null;
      });
      state.offline = !!KTA.store.read().settings.offline;
      renderMore();
      renderCurrent();
      if (state.screen === 'home') renderOfflineBanner();
      toast(state.offline ? t('eta.offline') : t('eta.live'));
      return;
    }
    KTA.store.update(function (st) { st.settings[key] = !st.settings[key]; });
    applyVisualSettings(KTA.store.read().settings);
    renderMore();
  }

  function applyVisualSettings(settings) {
    document.body.classList.toggle('large-text', !!settings.largeText);
    document.body.classList.toggle('contrast', !!settings.contrast);
    document.body.classList.toggle('light-mode', !!settings.lightMode);
  }

  /* ============================================================== BOOT ===== */
  function boot() {
    if (/embed=1/.test(window.location.search)) document.body.classList.add('embed');
    var settings = KTA.store.read().settings;
    LANG = KTA.i18n.setLang(settings.lang || 'en');
    applyVisualSettings(settings);
    state.offline = !!settings.offline;

    /* real browser connectivity also puts the app in last-known mode (IR5) */
    window.addEventListener('offline', function () {
      KTA.store.update(function (st) {
        if (!st.settings.offline) { st.settings.offline = true; st.settings.offlineSince = Date.now(); }
      });
      state.offline = true;
      renderCurrent();
    });
    window.addEventListener('online', function () {
      KTA.store.update(function (st) { st.settings.offline = false; st.settings.offlineSince = null; });
      state.offline = false;
      renderCurrent();
    });

    /* icons */
    $id('searchIcon').innerHTML = ICON('search', 18);
    $id('searchIcon2').innerHTML = ICON('search', 18);
    $id('qiPlan').innerHTML = ICON('plan', 18);
    $id('qiSos').innerHTML = ICON('sos', 18);
    $id('qiRobbery').innerHTML = ICON('flag', 18);
    $id('qiTrack').innerHTML = ICON('map', 18);
    $id('btnRouteBack').innerHTML = ICON('back', 20);
    $id('btnStopBack').innerHTML = ICON('back', 20);
    $id('btnSafetyBack').innerHTML = ICON('back', 20);
    $id('btnAlertsBack').innerHTML = ICON('back', 20);
    $id('btnMapAlerts').innerHTML = ICON('alert', 20);
    $id('btnSwap').innerHTML = ICON('swap', 18);
    document.querySelectorAll('.flip').forEach(function (el) { el.classList.add('flip'); });

    renderTabs();
    bindEvents();
    KTA.i18n.apply();
    go('home');
    renderEvalPanel();

    /* live updates */
    setInterval(refreshDynamic, 1000);

    /* cross-tab sync from the union portal */
    KTA.store.onChange(function () {
      applyVisualSettings(KTA.store.read().settings);
      renderCurrent();
      renderEvalPanel();
      if (state.screen === 'map') { renderMapBanner(); }
    });

    /* cross-tab sync of evaluation panel */
    window.addEventListener('storage', function (ev) {
      if (ev.key === 'kta_eval_v1') renderEvalPanel();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
