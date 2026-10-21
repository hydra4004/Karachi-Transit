/* ============================================================================
 * Karachi Transit App — evaluation instrumentation (Phase 3 ready)
 * ----------------------------------------------------------------------------
 * The prototype must be able to support a task-based usability evaluation.
 * This module records: task start/end, screen changes, taps, errors and
 * think-aloud notes, and exports them as JSON or CSV for analysis.
 * ==========================================================================*/
(function (root) {
  'use strict';
  var KTA = (root.KTA = root.KTA || {});

  var KEY = 'kta_eval_v1';

  var TASKS = [
    { id: 'T1', title: 'Find the bus that goes from a given stop to a given destination',
      prompt: 'Find the bus that goes from Saddar to Gulshan-e-Hadeed. Tell me which bus it is.',
      success: 'Opens the correct route (B21 + B13 connection)' },
    { id: 'T2', title: 'Track that bus and say when it reaches a given stop',
      prompt: 'Open the map, track that bus and tell me when it reaches PECHS. Say whether the time is live or estimated.',
      success: 'Reads the ETA correctly and mentions the Live/Estimated badge' },
    { id: 'T3', title: 'Plan a trip that needs two vehicles and describe the steps',
      prompt: 'Plan a journey from Sea View to Korangi and describe every step out loud.',
      success: 'Names both buses (B13, B21) and the transfer stop (PECHS)' },
    { id: 'T4', title: 'Trigger SOS, then cancel it; then report a robbery',
      prompt: 'Send an SOS and then cancel it. After that, send a robbery report.',
      success: 'Cancels the SOS inside the countdown window and submits the robbery report' }
  ];

  function blank() {
    return { enabled: false, sessionId: null, startedAt: null, events: [], currentTask: null, participant: '' };
  }

  function read() {
    try {
      var raw = root.localStorage ? root.localStorage.getItem(KEY) : null;
      if (!raw) return blank();
      var p = JSON.parse(raw);
      var b = blank();
      Object.keys(b).forEach(function (k) { if (p[k] === undefined) p[k] = b[k]; });
      return p;
    } catch (e) { return blank(); }
  }

  function write(s) {
    try { if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  var Eval = {
    TASKS: TASKS,

    isEnabled: function () { return read().enabled; },

    enable: function (participant) {
      var s = blank();
      s.enabled = true;
      s.participant = participant || ('P' + String(Math.floor(Math.random() * 90) + 10));
      s.sessionId = 'S' + Date.now().toString(36);
      s.startedAt = Date.now();
      write(s);
      Eval.log('session_start', { participant: s.participant, sessionId: s.sessionId });
      return s;
    },

    disable: function () {
      var s = read();
      s.enabled = false;
      write(s);
    },

    reset: function () { write(blank()); },

    log: function (type, meta) {
      var s = read();
      if (!s.enabled) return;
      s.events.push({
        t: Date.now() - (s.startedAt || Date.now()),
        type: type,
        task: s.currentTask,
        screen: currentScreen(),
        meta: meta || {}
      });
      write(s);
    },

    startTask: function (taskId) {
      var s = read();
      s.currentTask = taskId;
      write(s);
      Eval.log('task_start', { task: taskId });
    },

    endTask: function (taskId, meta) {
      var s = read();
      Eval.log('task_end', { task: taskId || s.currentTask, meta: meta || {} });
      s.currentTask = null;
      write(s);
    },

    note: function (text) { Eval.log('note', { text: text }); },
    error: function (text) { Eval.log('error', { text: text }); },

    events: function () { return read().events; },

    summary: function () {
      var s = read();
      var out = [];
      TASKS.forEach(function (t) {
        var start = null, end = null;
        s.events.forEach(function (e) {
          if (e.task !== t.id) return;
          if (e.type === 'task_start') start = e.t;
          if (e.type === 'task_end') end = e.t;
        });
        var errors = s.events.filter(function (e) { return e.task === t.id && e.type === 'error'; }).length;
        var taps = s.events.filter(function (e) { return e.task === t.id && e.type === 'tap'; }).length;
        out.push({
          task: t.id, title: t.title, success: t.success,
          durationSec: (start !== null && end !== null) ? Math.round((end - start) / 100) / 10 : null,
          taps: taps, errors: errors, completed: start !== null && end !== null
        });
      });
      return { sessionId: s.sessionId, participant: s.participant, startedAt: s.startedAt, tasks: out };
    },

    toJSON: function () { return JSON.stringify(read(), null, 2); },

    toCSV: function () {
      var s = read();
      var rows = [['participant', 'session', 't_ms', 'type', 'task', 'screen', 'meta']];
      s.events.forEach(function (e) {
        rows.push([
          s.participant, s.sessionId, e.t, e.type, e.task || '', e.screen || '',
          JSON.stringify(e.meta).replace(/"/g, "'")
        ]);
      });
      return rows.map(function (r) {
        return r.map(function (c) { return '"' + String(c === undefined ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
    },

    download: function (format) {
      var text = format === 'csv' ? Eval.toCSV() : Eval.toJSON();
      var name = 'kta_eval_' + (read().sessionId || 'session') + '.' + format;
      var blob = new root.Blob([text], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      var url = root.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      root.URL.revokeObjectURL(url);
    }
  };

  function currentScreen() {
    try {
      var el = document.querySelector('.screen.active');
      return el ? el.getAttribute('data-screen') : '';
    } catch (e) { return ''; }
  }

  KTA.evalTool = Eval;
  if (typeof module !== 'undefined' && module.exports) module.exports = Eval;
})(typeof window !== 'undefined' ? window : globalThis);
