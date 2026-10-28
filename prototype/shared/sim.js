/* ============================================================================
 * Karachi Transit App — Shared simulation engine (Phase 2 prototype)
 * ----------------------------------------------------------------------------
 * Provides:
 *   KTA.geo   — polyline helpers (length, point at t, projection, distance)
 *   KTA.sim   — vehicle state, ETA model, alert/review/report store
 *   KTA.store — localStorage backed store + cross-tab sync
 *
 * All positions are DERIVED from a deterministic clock so that the commuter
 * app and the union portal always agree, even in separate browser tabs.
 * ==========================================================================*/
(function (root) {
  'use strict';
  var KTA = (root.KTA = root.KTA || {});

  /* ------------------------------------------------------------------ geo */
  var KM_PER_PX = 0.028;          /* schematic map scale, approximate        */
  var DWELL_SEC = 25;             /* average stop dwell time in seconds     */

  function pathCum(path) {
    var cum = [0], i, a, b, d;
    for (i = 1; i < path.length; i++) {
      a = path[i - 1]; b = path[i];
      d = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
      cum.push(cum[i - 1] + d);
    }
    return cum;
  }

  function pathLength(cum) { return cum[cum.length - 1]; }

  function pointAt(path, cum, t) {
    var total = pathLength(cum);
    var target = ((t % 1) + 1) % 1 * total;
    var i, seg, f, a, b;
    for (i = 1; i < cum.length; i++) {
      if (cum[i] >= target) {
        seg = cum[i] - cum[i - 1] || 1;
        f = (target - cum[i - 1]) / seg;
        a = path[i - 1]; b = path[i];
        return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f };
      }
    }
    return { x: path[path.length - 1][0], y: path[path.length - 1][1] };
  }

  /* nearest point on the polyline to (x,y) -> {t, dist} */
  function project(path, cum, x, y) {
    var best = { t: 0, dist: Infinity };
    var total = pathLength(cum);
    for (var i = 1; i < path.length; i++) {
      var a = path[i - 1], b = path[i];
      var vx = b[0] - a[0], vy = b[1] - a[1];
      var len2 = vx * vx + vy * vy || 1;
      var t = ((x - a[0]) * vx + (y - a[1]) * vy) / len2;
      t = Math.max(0, Math.min(1, t));
      var px = a[0] + vx * t, py = a[1] + vy * t;
      var d = Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
      if (d < best.dist) {
        var segLen = Math.sqrt(len2);
        var at = (cum[i - 1] + t * segLen) / total;
        best = { t: at, dist: d };
      }
    }
    return best;
  }

  /* forward distance (0..1 of route) from t1 to t2 */
  function forwardDelta(t1, t2) { return ((t2 - t1) % 1 + 1) % 1; }

  KTA.geo = {
    KM_PER_PX: KM_PER_PX, DWELL_SEC: DWELL_SEC,
    pathCum: pathCum, pathLength: pathLength, pointAt: pointAt,
    project: project, forwardDelta: forwardDelta
  };

  /* ----------------------------------------------------------------- store */
  var STORE_KEY = 'kta_ops_v1';
  var listeners = [];

  function defaultState() {
    return {
      vehicles: {},     /* vid -> {status, delayMin, driver, note, updatedAt, updatedBy} */
      alerts: [],       /* published commuter-facing alerts                   */
      reports: [],      /* SOS + robbery reports                             */
      reviews: [],      /* user submitted reviews                            */
      settings: { lang: 'en', clockFactor: 4, largeText: false, contrast: false, lightMode: false, offline: false, offlineSince: null },
      session: { startedAt: null }
    };
  }

  function positionAt(v, at, settings) {
    var route = routeById(v.routeId);
    if (!route) return null;
    var now = at;
    if (settings.offline && settings.offlineSince) now = Math.min(now, settings.offlineSince);
    var factor = settings.clockFactor || 1;
    var t = ((v.phase + ((now - EPOCH) / 60000) * factor * v.speed) % 1 + 1) % 1;
    var point = KTA.geo.pointAt(route.path, route._cum, t);
    var next = KTA.geo.pointAt(route.path, route._cum, t + 0.004);
    return {
      t: t, x: point.x, y: point.y,
      heading: Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI
    };
  }

  var Store = {
    read: function () {
      try {
        var raw = root.localStorage ? root.localStorage.getItem(STORE_KEY) : null;
        if (!raw) return defaultState();
        var parsed = JSON.parse(raw);
        var base = defaultState();
        Object.keys(base).forEach(function (k) {
          if (parsed[k] === undefined) parsed[k] = base[k];
        });
        parsed.settings = Object.assign(base.settings, parsed.settings || {});
        var migrated = false;
        Object.keys(parsed.vehicles || {}).forEach(function (vid) {
          var ops = parsed.vehicles[vid];
          var vehicle = vehicleById(vid);
          if (ops.status !== 'out_of_service' || ops.frozenPosition || !vehicle) return;
          var frozen = positionAt(vehicle, ops.updatedAt || Date.now(), parsed.settings);
          if (frozen) {
            ops.frozenPosition = frozen;
            migrated = true;
          }
        });
        if (migrated && root.localStorage) root.localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
        return parsed;
      } catch (e) { return defaultState(); }
    },
    write: function (state) {
      try { if (root.localStorage) root.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
      listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
      emit();
    },
    update: function (fn) {
      var state = Store.read();
      fn(state);
      Store.write(state);
      return state;
    },
    onChange: function (fn) { listeners.push(fn); },
    reset: function () {
      try { if (root.localStorage) root.localStorage.removeItem(STORE_KEY); } catch (e) {}
      listeners.forEach(function (fn) { try { fn(Store.read()); } catch (e) {} });
      emit();
    }
  };

  function emit() {
    try {
      if (root.BroadcastChannel) {
        if (!Store._bc) Store._bc = new root.BroadcastChannel('kta-ops');
        Store._bc.postMessage('changed');
      }
    } catch (e) {}
  }

  if (root.addEventListener) {
    root.addEventListener('storage', function (ev) {
      if (ev.key === STORE_KEY) listeners.forEach(function (fn) { try { fn(Store.read()); } catch (e) {} });
    });
    root.addEventListener('message', function (ev) {
      if (ev.data === 'kta-ops-changed') listeners.forEach(function (fn) { try { fn(Store.read()); } catch (e) {} });
    });
  }

  KTA.store = Store;

  /* ------------------------------------------------------------------- sim */
  var EPOCH = new Date('2026-10-21T08:00:00Z').getTime();

  function clockFactor() {
    var s = Store.read().settings;
    return s.clockFactor || 1;
  }

  /* ---- connection state (IR5) ------------------------------------------
   * When the connection drops the app must keep showing the last known
   * position together with its age, instead of a blank map. The simulation
   * clock is frozen at the moment the connection was lost, so every vehicle
   * keeps its last known coordinates and every ETA keeps its last value.  */
  function isOffline() {
    return !!Store.read().settings.offline;
  }

  function offlineSince() {
    return Store.read().settings.offlineSince || null;
  }

  /* seconds since the last successful update */
  function offlineAgeSec() {
    var since = offlineSince();
    if (!since) return 0;
    return Math.max(0, Math.round((Date.now() - since) / 1000));
  }

  /* simulated minutes since EPOCH */
  function simMinutesAt(now) {
    var s = Store.read().settings;
    if (s.offline && s.offlineSince) now = Math.min(now, s.offlineSince);
    return ((now - EPOCH) / 60000) * clockFactor();
  }

  function simMinutes() { return simMinutesAt(Date.now()); }

  var routeIndex = {};
  KTA.data.ROUTES.forEach(function (r) {
    r._cum = KTA.geo.pathCum(r.path);
    r._lenPx = KTA.geo.pathLength(r._cum);
    r._lenKm = r._lenPx * KTA.geo.KM_PER_PX;
    r._stopT = {};
    r.stopIds.forEach(function (sid) {
      var st = stopById(sid);
      if (st) r._stopT[sid] = KTA.geo.project(r.path, r._cum, st.x, st.y).t;
    });
    routeIndex[r.id] = r;
  });

  function stopById(id) {
    for (var i = 0; i < KTA.data.STOPS.length; i++) if (KTA.data.STOPS[i].id === id) return KTA.data.STOPS[i];
    return null;
  }
  function routeById(id) { return routeIndex[id] || null; }
  function vehicleById(id) {
    for (var i = 0; i < KTA.data.VEHICLES.length; i++) if (KTA.data.VEHICLES[i].id === id) return KTA.data.VEHICLES[i];
    return null;
  }

  /* pseudo-random but deterministic jitter for "estimated" ETAs */
  function jitter(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1; /* -1..1 */
  }

  function opsFor(vid) {
    var s = Store.read();
    return s.vehicles[vid] || { status: 'running', delayMin: 0, driver: null, note: '', updatedAt: 0 };
  }

  /* ---- vehicle live state -------------------------------------------- */
  function vehicleState(v) {
    var route = routeById(v.routeId);
    var ops = opsFor(v.id);
    var t = ((v.phase + simMinutes() * v.speed) % 1 + 1) % 1;
    var pt = KTA.geo.pointAt(route.path, route._cum, t);
    var next = KTA.geo.pointAt(route.path, route._cum, t + 0.004);
    var heading = Math.atan2(next.y - pt.y, next.x - pt.x) * 180 / Math.PI;
    if (ops.status === 'out_of_service') {
      var frozen = ops.frozenPosition;
      if (!frozen) {
        var stoppedAt = ops.updatedAt || Date.now();
        t = ((v.phase + simMinutesAt(stoppedAt) * v.speed) % 1 + 1) % 1;
        pt = KTA.geo.pointAt(route.path, route._cum, t);
        next = KTA.geo.pointAt(route.path, route._cum, t + 0.004);
        heading = Math.atan2(next.y - pt.y, next.x - pt.x) * 180 / Math.PI;
      } else {
        t = frozen.t;
        pt = { x: frozen.x, y: frozen.y };
        heading = frozen.heading;
      }
    }
    var live = route.track === 'live' && ops.status !== 'out_of_service' && !isOffline();
    /* a couple of vehicles have a stale tracker to demonstrate IR5 */
    var stale = (v.id === 'v_b13_2');
    return {
      id: v.id, routeId: v.routeId, plate: v.plate, model: v.model,
      driver: ops.driver || v.driver,
      capacity: v.capacity, occupancy: v.occupancy, tripNo: v.tripNo,
      t: t, x: pt.x, y: pt.y, heading: heading,
      status: ops.status, delayMin: ops.delayMin || 0, note: ops.note || '',
      live: live, stale: stale,
      liveAgeSec: stale ? 154 : (isOffline() ? offlineAgeSec() : (live ? Math.round((Date.now() % 23)) : 0)),
      offline: isOffline(),
      estimatedAgeMin: Math.round(3 + Math.abs(jitter(v.phase * 100)) * 4)
    };
  }

  /* ---- ETA model ------------------------------------------------------ */
  /* returns minutes until the vehicle reaches `stopId` (null if not serving) */
  function etaMinutes(vehicle, stopId) {
    var route = routeById(vehicle.routeId);
    if (!route) return null;
    if (route.stopIds.indexOf(stopId) === -1) return null;
    var vs = vehicleState(vehicle);
    if (vs.status === 'out_of_service') return null;

    var tVeh = vs.t;
    var tStop = route._stopT[stopId];
    var d = KTA.geo.forwardDelta(tVeh, tStop);
    var km = d * route._lenKm;
    var speed = route.speedKmh || 22;
    var mins = (km / speed) * 60;

    /* dwell time at stops between the vehicle and the target stop */
    var between = 0;
    route.stopIds.forEach(function (sid) {
      var st = route._stopT[sid];
      if (st === undefined) return;
      var dd = KTA.geo.forwardDelta(tVeh, st);
      if (dd > 0.0001 && dd < d) between++;
    });
    mins += (between * KTA.geo.DWELL_SEC) / 60;

    /* route-level congestion factor, deterministic per minute */
    mins *= 1 + Math.abs(jitter(Math.floor(simMinutes()) + route.number.length)) * 0.12;

    if (vs.status === 'delayed') mins += vs.delayMin;
    if (route.track !== 'live') mins += Math.abs(jitter(vehicle.phase * 31 + Math.floor(simMinutes() / 3))) * 2.5;

    return Math.max(0, mins);
  }

  /* every arrival at a stop, sorted by time */
  function arrivalsForStop(stopId) {
    var out = [];
    KTA.data.VEHICLES.forEach(function (v) {
      var route = routeById(v.routeId);
      if (!route || route.stopIds.indexOf(stopId) === -1) return;
      var vs = vehicleState(v);
      if (vs.status === 'out_of_service') return;
      var mins = etaMinutes(v, stopId);
      if (mins === null) return;
      out.push({
        vehicleId: v.id, routeId: v.routeId, routeNumber: route.number, routeType: route.type,
        minutes: mins, status: vs.status, delayMin: vs.delayMin, live: vs.live, stale: vs.stale,
        liveAgeSec: vs.liveAgeSec, estimatedAgeMin: vs.estimatedAgeMin,
        vehicle: vs
      });
    });
    out.sort(function (a, b) { return a.minutes - b.minutes; });
    return out;
  }

  /* next departure for a route at a stop (used on route detail + home cards) */
  function nextArrival(routeId, stopId) {
    var list = arrivalsForStop(stopId).filter(function (a) { return a.routeId === routeId; });
    return list.length ? list[0] : null;
  }

  function routesServingStop(stopId) {
    return KTA.data.ROUTES.filter(function (r) { return r.stopIds.indexOf(stopId) !== -1; });
  }

  /* ---- reviews --------------------------------------------------------- */
  function allReviews() {
    return KTA.data.REVIEWS.concat(Store.read().reviews || []);
  }
  function reviewsFor(targetId) {
    return allReviews().filter(function (r) { return r.targetId === targetId; });
  }
  function ratingFor(targetId) {
    var rs = reviewsFor(targetId);
    if (!rs.length) return { avg: 0, count: 0 };
    var sum = rs.reduce(function (a, r) { return a + r.rating; }, 0);
    return { avg: sum / rs.length, count: rs.length };
  }
  function submitReview(review) {
    Store.update(function (s) {
      review.at = Date.now();
      review.id = 'rv_user_' + Date.now();
      s.reviews.unshift(review);
    });
  }

  /* ---- alerts (published by the union portal) -------------------------- */
  function alerts() {
    var s = Store.read();
    return (s.alerts || []).slice().sort(function (a, b) { return b.at - a.at; });
  }
  function activeAlerts() {
    var cutoff = Date.now() - 1000 * 60 * 60 * 2;
    return alerts().filter(function (a) { return a.at > cutoff && a.active !== false; });
  }
  function publishAlert(alert) {
    Store.update(function (s) {
      alert.id = 'al_' + Date.now();
      alert.at = Date.now();
      s.alerts.unshift(alert);
    });
  }
  function setVehicleOps(vid, patch) {
    Store.update(function (s) {
      var current = s.vehicles[vid] || { status: 'running' };
      var updated = Object.assign({}, current, patch, { updatedAt: Date.now(), updatedBy: 'union-portal' });
      if (updated.status === 'out_of_service') {
        if (current.status !== 'out_of_service' || !current.frozenPosition) {
          var vehicle = vehicleById(vid);
          if (vehicle) {
            updated.frozenPosition = positionAt(vehicle, Date.now(), s.settings);
          }
        }
      } else {
        delete updated.frozenPosition;
      }
      s.vehicles[vid] = updated;
    });
  }

  /* ---- reports (SOS / robbery) ---------------------------------------- */
  function reports() { return (Store.read().reports || []).slice(); }
  function submitReport(report) {
    Store.update(function (s) {
      var vehicle = report.vehicleId ? vehicleById(report.vehicleId) : null;
      if (vehicle) {
        var route = routeById(vehicle.routeId);
        report.routeId = vehicle.routeId;
        report.routeNumber = route ? route.number : null;
        report.plate = vehicle.plate;
      }
      report.id = 'rp_' + Date.now();
      report.at = Date.now();
      report.status = 'received';
      s.reports.unshift(report);
    });
  }

  /* ---- planner --------------------------------------------------------- */
  function findPlan(fromId, toId) {
    var plans = KTA.data.PLANS;
    for (var i = 0; i < plans.length; i++) if (plans[i].from === fromId && plans[i].to === toId) return plans[i];
    return buildPlan(fromId, toId);
  }

  /* Fallback "AI" planner: breadth-first search over the stop graph.
   * Two kinds of edge:
   *   route leg — stay on one vehicle between two of its stops
   *   walk leg  — move between two stops that are within a short walk
   *               (e.g. the chinchi point at Merewether Clock Tower and the
   *                KPT Head Office bus stop are nearby)
   * The search prefers fewer vehicles, then fewer chinchi legs, because a bus
   * trip is more predictable than a chinchi trip. Every generated step names
   * the stop and explains the choice (explainability, IR6). */
  var WALK_LIMIT_PX = 46;

  function walkLinks(stopId) {
    var a = stopById(stopId);
    if (!a) return [];
    var out = [];
    KTA.data.STOPS.forEach(function (b) {
      if (b.id === stopId) return;
      var d = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
      if (d <= WALK_LIMIT_PX) {
        out.push({ kind: 'walk', to: b.id, dist: d, min: Math.max(2, Math.round(d / 14)) });
      }
    });
    return out;
  }

  function buildPlan(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return null;

    /* adjacency: stop -> legs leaving it */
    var adj = {};
    KTA.data.ROUTES.forEach(function (r) {
      r.stopIds.forEach(function (a, i) {
        r.stopIds.forEach(function (b, j) {
          if (i === j) return;
          if (!adj[a]) adj[a] = [];
          adj[a].push({ kind: 'route', route: r, to: b, dist: Math.abs(i - j) });
        });
      });
    });
    KTA.data.STOPS.forEach(function (s) {
      walkLinks(s.id).forEach(function (w) {
        if (!adj[s.id]) adj[s.id] = [];
        adj[s.id].push(w);
      });
    });

    var frontier = [{ stop: fromId, path: [] }];
    var solutions = [];
    for (var depth = 0; depth < 4 && frontier.length; depth++) {
      var next = [];
      for (var n = 0; n < frontier.length; n++) {
        var node = frontier[n];
        if (node.path.length && node.stop === toId) { solutions.push(node.path); continue; }
        var nbrs = adj[node.stop] || [];
        for (var k = 0; k < nbrs.length; k++) {
          var nb = nbrs[k];
          var leg = nb.kind === 'walk'
            ? { kind: 'walk', from: node.stop, to: nb.to, min: nb.min }
            : { kind: 'route', route: nb.route, from: node.stop, to: nb.to, dist: nb.dist, min: legMinutes(nb) };
          next.push({ stop: nb.to, path: node.path.concat([leg]) });
        }
      }
      if (solutions.length) break;
      frontier = next.slice(0, 600);
    }
    if (!solutions.length) return null;

    /* prefer fewer chinchi legs, then fewer vehicles, then shorter time */
    solutions.sort(function (a, b) {
      var ca = a.filter(function (l) { return l.kind === 'route' && l.route.type === 'chinchi'; }).length;
      var cb = b.filter(function (l) { return l.kind === 'route' && l.route.type === 'chinchi'; }).length;
      if (ca !== cb) return ca - cb;
      var va = a.filter(function (l) { return l.kind === 'route'; }).length;
      var vb = b.filter(function (l) { return l.kind === 'route'; }).length;
      if (va !== vb) return va - vb;
      return totalMinutes(a) - totalMinutes(b);
    });

    return planFromLegs(fromId, toId, solutions[0]);
  }

  function legMinutes(leg) {
    return Math.round(6 + leg.dist * 5 + (leg.route.type === 'chinchi' ? 4 : 0));
  }

  function totalMinutes(path) {
    var m = 0;
    path.forEach(function (l, i) { m += l.min + (i > 0 ? 7 : 0); });
    return m;
  }

  function planFromLegs(fromId, toId, path) {
    var steps = [];
    var total = 0, cost = 0;
    var prevWasRoute = false;
    path.forEach(function (leg) {
      if (leg.kind === 'walk') {
        steps.push({
          kind: 'walk', min: leg.min, fromStop: leg.from, toStop: leg.to,
          reasonEn: 'Walk ' + leg.min + ' minutes from ' + stopNameFor(leg.from) + ' to ' + stopNameFor(leg.to) + ' — they are the same place.',
          reasonUr: stopNameFor(leg.from) + ' سے ' + stopNameFor(leg.to) + ' تک ' + leg.min + ' منٹ پیدل — یہ ایک ہی جگہ ہے۔'
        });
        total += leg.min;
        prevWasRoute = false;
        return;
      }
      if (prevWasRoute) {
        steps.push({
          kind: 'transfer', atStop: leg.from, min: 7,
          reasonEn: 'Change to ' + leg.route.number + ' at ' + stopNameFor(leg.from) + '. Both vehicles stop here, so the wait is short.',
          reasonUr: stopNameFor(leg.from) + ' پر ' + leg.route.number + ' میں تبدیلی کریں۔ دونوں گاڑیاں یہیں رکتی ہیں، انتظار کم ہے۔'
        });
        total += 7;
      }
      steps.push({
        kind: 'board', mode: leg.route.type, routeId: leg.route.id, vehicle: leg.route.number,
        fromStop: leg.from, toStop: leg.to, min: leg.min, fare: leg.route.fare,
        reasonEn: leg.route.number + ' is the ' + (leg.route.type === 'bus' ? 'bus' : 'chinchi') +
          ' that covers ' + stopNameFor(leg.from) + ' → ' + stopNameFor(leg.to) + ' in about ' + leg.min + ' minutes.',
        reasonUr: leg.route.number + ' ' + stopNameFor(leg.from) + ' سے ' + stopNameFor(leg.to) + ' تک تقریباً ' + leg.min + ' منٹ میں جاتی ہے۔'
      });
      total += leg.min;
      cost += leg.route.fare;
      prevWasRoute = true;
    });
    steps.push({
      kind: 'walk', min: 4, toStop: toId,
      reasonEn: 'Short walk from the stop to the destination.', reasonUr: 'اسٹاپ سے منزل تک مختصر فاصلہ۔'
    });
    return {
      id: 'plan_gen_' + fromId + '_' + toId, from: fromId, to: toId,
      title: stopNameFor(fromId) + ' → ' + stopNameFor(toId),
      totalMin: total + 4, walkMin: 4, cost: cost, steps: steps, generated: true
    };
  }

  function stopNameFor(id) {
    var s = stopById(id);
    return s ? s.name : id;
  }

  function makePlan(fromId, toId, steps) {
    var total = 0, cost = 0;
    steps.forEach(function (s) { total += s.min || 0; cost += s.fare || 0; });
    var a = stopById(fromId), b = stopById(toId);
    return {
      id: 'plan_gen_' + fromId + '_' + toId, from: fromId, to: toId,
      title: (a ? a.name : fromId) + ' → ' + (b ? b.name : toId),
      totalMin: total, walkMin: 4, cost: cost, steps: steps, generated: true
    };
  }

  function plansFrom(fromId) {
    return KTA.data.PLANS.filter(function (p) { return p.from === fromId; });
  }

  /* ---- search ---------------------------------------------------------- */
  function search(query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return [];
    var res = { stops: [], routes: [], places: [] };
    KTA.data.STOPS.forEach(function (s) {
      if (s.name.toLowerCase().indexOf(q) !== -1 || s.ur.indexOf(query.trim()) !== -1 ||
          s.area.toLowerCase().indexOf(q) !== -1 || s.landmark.toLowerCase().indexOf(q) !== -1) {
        res.stops.push(s);
      }
    });
    KTA.data.ROUTES.forEach(function (r) {
      if (r.number.toLowerCase().indexOf(q) !== -1 || r.name.toLowerCase().indexOf(q) !== -1 ||
          r.ur.indexOf(query.trim()) !== -1) res.routes.push(r);
    });
    KTA.data.PLACES.forEach(function (p) {
      if (p.en.toLowerCase().indexOf(q) !== -1 || p.ur.indexOf(query.trim()) !== -1) res.places.push(p);
    });
    return res;
  }

  /* ---- live route "bus progress" for a route: where is each vehicle ----- */
  function routeProgress(routeId) {
    var route = routeById(routeId);
    if (!route) return null;
    var out = [];
    KTA.data.VEHICLES.filter(function (v) { return v.routeId === routeId; }).forEach(function (v) {
      var vs = vehicleState(v);
      var nextStop = null, nextIdx = -1;
      route.stopIds.forEach(function (sid, i) {
        var st = route._stopT[sid];
        var d = KTA.geo.forwardDelta(vs.t, st);
        if (nextIdx === -1 || d < nextIdx) { nextIdx = d; nextStop = sid; }
      });
      out.push({ vehicle: vs, nextStop: nextStop, etaToNext: etaMinutes(v, nextStop) });
    });
    return out;
  }

  KTA.sim = {
    simMinutes: simMinutes,
    isOffline: isOffline,
    offlineAgeSec: offlineAgeSec,
    vehicleState: vehicleState,
    vehicles: function () { return KTA.data.VEHICLES.map(vehicleState); },
    vehiclesOfRoute: function (routeId) { return KTA.data.VEHICLES.filter(function (v) { return v.routeId === routeId; }).map(vehicleState); },
    etaMinutes: etaMinutes,
    arrivalsForStop: arrivalsForStop,
    nextArrival: nextArrival,
    routesServingStop: routesServingStop,
    allReviews: allReviews,
    reviewsFor: reviewsFor,
    ratingFor: ratingFor,
    submitReview: submitReview,
    alerts: alerts,
    activeAlerts: activeAlerts,
    publishAlert: publishAlert,
    setVehicleOps: setVehicleOps,
    opsFor: opsFor,
    reports: reports,
    submitReport: submitReport,
    findPlan: findPlan,
    plansFrom: plansFrom,
    search: search,
    routeProgress: routeProgress,
    stopById: stopById,
    routeById: routeById,
    vehicleById: vehicleById
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = KTA;
})(typeof window !== 'undefined' ? window : globalThis);
