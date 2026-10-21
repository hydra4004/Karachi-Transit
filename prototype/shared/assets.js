/* ============================================================================
 * Karachi Transit App — inline SVG assets (no network requests)
 * Landmark illustrations support FR9 (landmark name + photo for chinchi stops)
 * and the icon set supports consistency across screens.
 * ==========================================================================*/
(function (root) {
  'use strict';
  var KTA = (root.KTA = root.KTA || {});

  var PALETTE = {
    sky: ['#cfe8f5', '#eaf5fb'], building: ['#e6e9ef', '#cfd6e2'], road: '#c9cdd6',
    accent: '#0f766e', warm: '#f59e0b', green: '#15803d', sand: '#f2e3c4'
  };

  /* ---------------- landmark illustrations -------------------------------- */
  var LANDMARKS = {
    clock: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="18" y="96" width="204" height="54" fill="' + PALETTE.road + '"/>' +
        '<rect x="92" y="34" width="56" height="96" rx="4" fill="#e7d9b8"/>' +
        '<rect x="99" y="42" width="42" height="42" rx="3" fill="#ffffff" stroke="#a1916f" stroke-width="3"/>' +
        '<circle cx="120" cy="63" r="3" fill="#334155"/><path d="M120 63 L120 50 M120 63 L131 68" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M92 34 L120 12 L148 34 Z" fill="#c9b083"/><rect x="116" y="84" width="8" height="16" fill="#a1916f"/>';
    },
    market: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="30" y="70" width="180" height="80" fill="#f3e6cd"/>' +
        '<path d="M24 70 L216 70 L204 48 L36 48 Z" fill="#e0a458"/>' +
        '<g fill="#fff"><rect x="44" y="84" width="34" height="26"/><rect x="102" y="84" width="34" height="26"/><rect x="160" y="84" width="34" height="26"/></g>' +
        '<g fill="#d97706"><circle cx="52" cy="128" r="9"/><circle cx="76" cy="130" r="7"/><circle cx="112" cy="129" r="8"/><circle cx="168" cy="128" r="9"/><circle cx="190" cy="131" r="7"/></g>' +
        '<rect x="30" y="126" width="180" height="24" fill="' + PALETTE.road + '"/>';
    },
    beach: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect y="88" width="240" height="62" fill="#f2e3c4"/>' +
        '<path d="M0 88 q30 -12 60 0 t60 0 t60 0 t60 0 v14 H0 Z" fill="#67c3d6"/>' +
        '<path d="M150 96 l40 -34 l-6 40 z" fill="#ffffff" opacity="0.85"/>' +
        '<rect x="40" y="52" width="4" height="40" fill="#8a6b4a"/><path d="M44 54 q22 10 40 0 q-18 20 -40 4 z" fill="#16a34a"/>';
    },
    flyover: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="0" y="118" width="240" height="32" fill="' + PALETTE.road + '"/>' +
        '<path d="M10 118 q60 -58 120 -58 q54 0 100 24" stroke="#94a3b8" stroke-width="14" fill="none" stroke-linecap="round"/>' +
        '<path d="M10 118 q60 -58 120 -58 q54 0 100 24" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 12" fill="none"/>' +
        '<rect x="60" y="92" width="12" height="30" fill="#b6bfcc"/><rect x="140" y="82" width="12" height="40" fill="#b6bfcc"/>';
    },
    office: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="46" y="44" width="148" height="106" fill="#dde3ec"/>' +
        '<g fill="#8fa3bd"><rect x="60" y="58" width="22" height="18"/><rect x="90" y="58" width="22" height="18"/><rect x="120" y="58" width="22" height="18"/><rect x="150" y="58" width="22" height="18"/>' +
        '<rect x="60" y="86" width="22" height="18"/><rect x="90" y="86" width="22" height="18"/><rect x="120" y="86" width="22" height="18"/><rect x="150" y="86" width="22" height="18"/>' +
        '<rect x="60" y="114" width="22" height="18"/><rect x="150" y="114" width="22" height="18"/></g>' +
        '<rect x="92" y="114" width="56" height="36" fill="#94a3b8"/>';
    },
    chowk: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<path d="M0 104 h240 v46 H0 Z" fill="' + PALETTE.road + '"/><path d="M0 124 h240" stroke="#ffffff" stroke-width="3" stroke-dasharray="16 16"/>' +
        '<path d="M120 104 v46" stroke="#ffffff" stroke-width="3" stroke-dasharray="16 16"/>' +
        '<circle cx="120" cy="104" r="26" fill="#cbd5e1"/><circle cx="120" cy="104" r="16" fill="#94a3b8"/>' +
        '<rect x="26" y="52" width="40" height="52" fill="#e2e8f0"/><rect x="170" y="62" width="46" height="42" fill="#e2e8f0"/>';
    },
    gate: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="30" y="96" width="180" height="54" fill="' + PALETTE.road + '"/>' +
        '<rect x="44" y="40" width="16" height="84" fill="#b6bfcc"/><rect x="180" y="40" width="16" height="84" fill="#b6bfcc"/>' +
        '<path d="M44 40 h152 v14 H44 Z" fill="#94a3b8"/>' +
        '<rect x="84" y="72" width="72" height="52" rx="4" fill="#e7d9b8"/><rect x="112" y="94" width="16" height="30" fill="#a1916f"/>';
    },
    terminal: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="0" y="112" width="240" height="38" fill="' + PALETTE.road + '"/>' +
        '<path d="M28 112 L52 52 H188 L212 112 Z" fill="#dbe4ef"/>' +
        '<rect x="66" y="66" width="108" height="46" fill="#ffffff" opacity="0.9"/>' +
        '<rect x="76" y="76" width="40" height="8" fill="#0f766e"/><rect x="76" y="90" width="64" height="6" fill="#94a3b8"/>';
    },
    shop: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="40" y="62" width="160" height="88" fill="#f6efe0"/>' +
        '<path d="M34 62 h172 l-10 -22 H44 Z" fill="#0f766e"/>' +
        '<rect x="58" y="96" width="124" height="54" fill="#8a6b4a"/>' +
        '<circle cx="86" cy="120" r="12" fill="#e0a458"/><circle cx="120" cy="122" r="10" fill="#d97706"/><circle cx="152" cy="120" r="12" fill="#e0a458"/>';
    },
    mosque: function (id) {
      return '<rect width="240" height="150" fill="url(#g' + id + ')"/>' +
        '<rect x="52" y="70" width="136" height="80" fill="#e7e2d4"/>' +
        '<path d="M120 24 q34 24 34 46 H86 q0 -22 34 -46 z" fill="#0f766e"/>' +
        '<rect x="114" y="8" width="6" height="26" fill="#a1916f"/><circle cx="117" cy="8" r="5" fill="#f59e0b"/>' +
        '<path d="M52 70 q22 -18 44 0 M144 70 q22 -18 44 0" fill="#0f766e" opacity="0.85"/>';
    }
  };

  function landmarkSVG(key, label) {
    var draw = LANDMARKS[key] || LANDMARKS.chowk;
    var id = 'lg' + Math.random().toString(36).slice(2, 8);
    var labelText = label ? '<text x="12" y="142" font-family="Segoe UI, sans-serif" font-size="11" fill="#334155">' +
      String(label).slice(0, 34) + '</text>' : '';
    return '<svg viewBox="0 0 240 150" role="img" aria-label="' + (label || 'landmark') + '" class="landmark-svg">' +
      '<defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#e8f2f8"/><stop offset="1" stop-color="#cfe3ef"/></linearGradient></defs>' +
      draw(id) + labelText + '</svg>';
  }

  /* ---------------- icon set ---------------------------------------------- */
  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    map: '<path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6z"/><path d="M9 3v15M15 6v15"/>',
    routes: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.5 6H16a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8.5"/>',
    plan: '<path d="M9 20 3 14l4-4 6 6 8-8 4 4z"/><path d="M14 6l4 4"/>',
    more: '<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/>',
    star: '<path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.5 6.6 20.4l1-6.1L3.2 10l6.1-.9z"/>',
    alert: '<path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    sos: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5M12 16.2v.1"/>',
    phone: '<path d="M6 3.5h3l1.6 4-2 1.6a12 12 0 0 0 6.3 6.3l1.6-2 4 1.6v3a1.5 1.5 0 0 1-1.6 1.5C11 19.5 4.5 13 4.5 5.1A1.5 1.5 0 0 1 6 3.5z"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    bus: '<rect x="4" y="4" width="16" height="13" rx="2.5"/><path d="M4 11h16M8 17v2.5M16 17v2.5"/><circle cx="8" cy="13.8" r="1"/><circle cx="16" cy="13.8" r="1"/>',
    rickshaw: '<circle cx="6.5" cy="17" r="2.6"/><circle cx="17.5" cy="17" r="2.6"/><path d="M4 14h7l3-7h4"/><path d="M11 14 9 7H6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M9 21l2.5-6.5L9 12V7.5l5 1.5 2 4 3 1"/><path d="M11.5 14.5 8 17l-2 4"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-1.5 5.5"/><path d="M20 5v6h-6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    flag: '<path d="M5 21V4h11l-1.5 3.5L16 11H5"/>'
  };

  function icon(name, size, cls) {
    var body = ICONS[name] || '';
    var s = size || 22;
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body + '</svg>';
  }

  function starsHTML(rating, size) {
    var s = size || 18;
    var out = '';
    for (var i = 1; i <= 5; i++) {
      var filled = rating >= i - 0.25;
      out += '<svg class="icon star' + (filled ? ' filled' : '') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s +
        '" fill="' + (filled ? '#f59e0b' : 'none') + '" stroke="#f59e0b" stroke-width="1.6" stroke-linejoin="round">' + ICONS.star + '</svg>';
    }
    return out;
  }

  KTA.assets = { landmarkSVG: landmarkSVG, icon: icon, starsHTML: starsHTML, ICONS: ICONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = KTA.assets;
})(typeof window !== 'undefined' ? window : globalThis);
