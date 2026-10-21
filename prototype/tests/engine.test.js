/* ============================================================================
 * Engine smoke test — run with:  node prototype/tests/engine.test.js
 * Checks the simulated data set, ETA model and journey planner without a browser.
 * ==========================================================================*/
'use strict';
var path = require('path');
var fs = require('fs');

/* --- minimal localStorage stub so the shared modules run in node --------- */
var mem = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
  setItem: function (k, v) { mem[k] = String(v); },
  removeItem: function (k) { delete mem[k]; }
};

var root = path.join(__dirname, '..', 'shared');
global.window = global;
require(path.join(root, 'data.js'));
require(path.join(root, 'sim.js'));

var KTA = global.KTA;
var fails = 0, checks = 0;

function ok(cond, msg) {
  checks++;
  if (!cond) { fails++; console.log('  FAIL  ' + msg); }
  else console.log('  pass  ' + msg);
}

console.log('\n1) data integrity');
KTA.data.ROUTES.forEach(function (r) {
  ok(r.stopIds.length >= 3, r.number + ' has at least 3 stops');
  ok(r.path.length >= 2, r.number + ' has a drawable path');
  r.stopIds.forEach(function (sid) {
    ok(!!KTA.sim.stopById(sid), r.number + ' stop ' + sid + ' exists');
  });
});
KTA.data.VEHICLES.forEach(function (v) {
  ok(!!KTA.sim.routeById(v.routeId), 'vehicle ' + v.id + ' belongs to a known route');
  ok(!!v.driver && !!v.driver.name, 'vehicle ' + v.id + ' has exactly one driver');
});

console.log('\n2) stop projection onto route lines');
KTA.data.ROUTES.forEach(function (r) {
  Object.keys(r._stopT).forEach(function (sid) {
    var t = r._stopT[sid];
    ok(t >= 0 && t <= 1, r.number + ' projects ' + sid + ' onto its line (t=' + t.toFixed(3) + ')');
  });
});

console.log('\n3) ETA model');
var total = 0;
KTA.data.VEHICLES.forEach(function (v) {
  var r = KTA.sim.routeById(v.routeId);
  r.stopIds.forEach(function (sid) {
    var m = KTA.sim.etaMinutes(v, sid);
    total++;
    ok(m !== null && m >= 0 && m < 600, v.id + ' ETA to ' + sid + ' = ' + (m === null ? 'null' : m.toFixed(1)) + ' min');
  });
});
console.log('  (' + total + ' vehicle/stop pairs checked)');

console.log('\n4) arrivals are sorted and per stop');
['st_jpo', 'st_pechs', 'st_ghanta', 'st_gulshan'].forEach(function (sid) {
  var arr = KTA.sim.arrivalsForStop(sid);
  var sorted = arr.every(function (a, i) { return i === 0 || arr[i - 1].minutes <= a.minutes; });
  ok(sorted, sid + ' arrivals are sorted by time (' + arr.length + ' arrivals)');
});

console.log('\n5) journey planner');
['st_jpo|st_gulshan', 'st_seaview|st_korangi', 'st_ned|st_airport', 'st_ghanta|st_clifton',
  'st_uni|st_malir', 'st_jpo|st_north'].forEach(function (pair) {
  var p = pair.split('|');
  var plan = KTA.sim.findPlan(p[0], p[1]);
  ok(!!plan, 'plan found for ' + p[0] + ' → ' + p[1] + (plan ? ' (' + plan.steps.length + ' steps, ' + plan.totalMin + ' min)' : ''));
  if (plan) {
    ok(plan.steps.length >= 2, 'plan has at least 2 steps');
    ok(plan.steps.every(function (s) { return !!s.reasonEn && !!s.reasonUr; }), 'every step explains itself (EN + UR)');
  }
});
var fallback = KTA.sim.findPlan('st_north', 'st_pechs');
ok(!!fallback, 'fallback planner generates a route for an unprepared pair');

console.log('\n6) union store round trip');
KTA.sim.setVehicleOps('v_b21_1', { status: 'delayed', delayMin: 12, note: 'test' });
var ops = KTA.sim.opsFor('v_b21_1');
ok(ops.status === 'delayed' && ops.delayMin === 12, 'vehicle status persisted');
KTA.sim.publishAlert({ routeId: 'r_b21', routeNumber: 'B21', routeName: 'Saddar → Korangi', severity: 'delayed', message: 'test', messageUr: 'test' });
ok(KTA.sim.alerts().length === 1, 'alert published to the store');
KTA.sim.submitReport({ type: 'sos', location: { label: 'Saddar' } });
ok(KTA.sim.reports().length === 1, 'SOS report stored');
KTA.sim.submitReview({ targetType: 'driver', targetId: 'v_b21_1', author: 'test', rating: 5, tags: [], text: '' });
ok(KTA.sim.ratingFor('v_b21_1').count >= 1, 'review stored and rating computed');

console.log('\n7) search');
var res = KTA.sim.search('gulshan');
ok(res.stops.length + res.routes.length > 0, 'search for "gulshan" returns results');

console.log('\n' + (fails === 0 ? 'ALL PASS' : fails + ' FAILURES') + ' — ' + checks + ' checks\n');
process.exit(fails === 0 ? 0 : 1);
