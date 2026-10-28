/* ============================================================================
 * Karachi Transit App — bilingual string table (English / Urdu)
 * FR10 + IR4: commuters can switch language; Urdu switches the layout to RTL.
 * ==========================================================================*/
(function (root) {
  'use strict';
  var KTA = (root.KTA = root.KTA || {});

  var STRINGS = {
    'app.name':          ['Karachi Transit', 'کراچی ٹرانزٹ'],
    'app.tagline':       ['Bus & Chinchi, live', 'بس و چنچی، لائیو'],
    'tab.home':          ['Home', 'ہوم'],
    'tab.map':           ['Map', 'نقشہ'],
    'tab.routes':        ['Routes', 'روٹس'],
    'tab.plan':          ['Plan', 'منصوبہ'],
    'tab.more':          ['More', 'مزید'],

    'common.back':       ['Back', 'واپس'],
    'common.close':      ['Close', 'بند کریں'],
    'common.cancel':     ['Cancel', 'منسوخ'],
    'common.confirm':    ['Confirm', 'تصدیق'],
    'common.submit':     ['Submit', 'جمع کریں'],
    'common.done':       ['Done', 'مکمل'],
    'common.min':        ['min', 'منٹ'],
    'common.now':        ['Now', 'ابھی'],
    'common.stops':      ['stops', 'اسٹاپ'],
    'common.from':       ['From', 'سے'],
    'common.to':         ['To', 'تک'],
    'common.optional':   ['optional', 'اختیاری'],
    'common.noResults':  ['No results', 'کوئی نتیجہ نہیں'],

    'eta.live':          ['Live', 'لائیو'],
    'eta.estimated':     ['Estimated', 'تخمینی'],
    'eta.updated':       ['updated {n}s ago', '{n} سیکنڈ پہلے اپ ڈیٹ'],
    'eta.scheduled':     ['schedule · updated {n} min ago', 'شیڈول · {n} منٹ پہلے اپ ڈیٹ'],
    'eta.stale':         ['last known · {n} min ago', 'آخری معلوم · {n} منٹ پہلے'],
    'eta.offline':       ['Connection lost', 'کنکشن قطع'],
    'eta.offlineBody':   ['Showing the last known position. Live updates will resume automatically.',
                          'آخری معلوم مقام دکھایا جا رہا ہے۔ لائیو اپ ڈیٹ خودکار بحال ہو جائے گا۔'],
    'eta.offlineAge':    ['last update {n} min ago', 'آخری اپ ڈیٹ {n} منٹ پہلے'],
    'eta.lastKnown':     ['Last known', 'آخری معلوم'],
    'eta.delayed':       ['Delayed {n} min', '{n} منٺ دیر'],
    'eta.oos':           ['Out of service', 'سروس میں نہیں'],
    'eta.in':            ['in {n} min', '{n} منٹ میں'],

    'home.search':       ['Where do you want to go?', 'کہاں جانا ہے؟'],
    'home.searchHint':   ['Search a stop, route number or area', 'اسٹاپ، روٹ نمبر یا علاقہ تلاش کریں'],
    'home.quick':        ['Quick actions', 'فوری اقدامات'],
    'home.planTrip':     ['Plan a trip', 'سفر منصوبہ بنائیں'],
    'home.sos':          ['SOS', 'ایس او ایس'],
    'home.robbery':      ['Complaint', 'شکایت'],
    'home.track':        ['Track a bus', 'بس ٹریک کریں'],
    'home.savedPlaces':  ['Saved places', 'محفوظ مقامات'],
    'home.nearYou':      ['Next buses near you', 'آپ کے قریب آنے والی بسیں'],
    'home.alerts':       ['Service alerts', 'سروس الرٹ'],

    'map.title':         ['Live map', 'لائیو نقشہ'],
    'map.subtitle':      ['Approximate landmarks; routes and vehicle positions are simulated', 'نشانات مقامات کے اندازے ہیں؛ روٹس اور گاڑیوں کی جگہیں فرضی ہیں'],
    'map.legend':        ['Legend', 'کلید'],
    'map.bus':           ['Bus', 'بس'],
    'map.chinchi':       ['Chinchi', 'چنچی'],
    'map.stop':          ['Stop', 'اسٹاپ'],
    'map.tapStop':       ['Tap a stop or a vehicle for details', 'تفصیل کے لیے اسٹاپ یا گاڑی پر ٹیپ کریں'],
    'map.zoomIn':        ['Zoom in', 'زوم ان'],
    'map.zoomOut':       ['Zoom out', 'زوم آؤٹ'],
    'map.fit':           ['Fit routes', 'روٹس ڈھانچیں'],
    'map.showRoutes':    ['Show on map', 'میپ پر دکھائیں'],
    'map.routesShown':   ['Showing {n} of {m} routes', '{m} میں سے {n} روٹس دکھائی جا رہی ہیں'],
    'map.selectedRoutes':['Selected routes', 'منتخب روٹس'],

    'routes.title':      ['All routes', 'تمام روٹس'],
    'routes.all':        ['All', 'سب'],
    'routes.bus':        ['Bus', 'بس'],
    'routes.chinchi':    ['Chinchi', 'چنچی'],
    'routes.stopsOn':    ['Stops on this route', 'اس روٹ کے اسٹاپس'],
    'routes.next':       ['Next departures', 'اگلی روانگیاں'],
    'routes.noTracker':  ['No tracker on this route — times are estimated', 'اس روٹ پر ٹریکر نہیں — اوقات تخمینی ہیں'],
    'routes.operator':   ['Operator', 'آپریٹر'],
    'routes.fare':       ['Fare', 'کرایہ'],
    'routes.every':      ['Every {n} min', 'ہر {n} منٹ'],
    'routes.liveBus':    ['Bus live on the route', 'روٹ پر بس لائیو ہے'],

    'route.nextStop':    ['Next stop', 'اگلا اسٹاپ'],
    'route.driver':      ['Driver', 'ڈرائیور'],
    'route.vehicle':     ['Vehicle', 'گاڑی'],
    'route.plate':       ['Number plate', 'نمبر پلیٹ'],
    'route.capacity':    ['Capacity', 'گنجائش'],
    'route.onboard':     ['On board now', 'اس وقت موجود'],
    'route.reviews':     ['Driver reviews', 'ڈرائیور کے تبصرے'],
    'route.rateDriver':  ['Rate this driver', 'اس ڈرائیور کو ریٹنگ دیں'],
    'route.noReviews':   ['No reviews for this driver yet', 'اس ڈرائیور کے لیے ابھی کوئی تبصرہ نہیں'],
    'route.ratingOf':    ['{a} out of 5 · {b} reviews', '{b} تبصرے · 5 میں سے {a}'],

    'stop.nextBuses':    ['Next buses at this stop', 'اس اسٹاپ پر آنے والی بسیں'],
    'stop.landmark':     ['Landmark', 'نشانی'],
    'stop.identify':     ['How commuters name this stop', 'مسافر اس اسٹاپ کو کیسے کہتے ہیں'],
    'stop.formal':       ['Formal bus stop', 'باقاعدہ بس اسٹاپ'],
    'stop.informal':     ['Informal chinchi point', 'غیر باقاعدہ چنچی پوائنٹ'],
    'stop.serving':      ['Routes serving this stop', 'اس اسٹاپ پر چلنے والے روٹس'],
    'stop.planFrom':     ['Plan from here', 'یہاں سے منصوبہ بنائیں'],
    'stop.noBus':        ['No bus listed for this stop right now', 'اس اسٹاپ پر اس وقت کوئی بس نہیں'],
    'stop.chinchiOnly':  ['Only chinchi service stops here', 'یہاں صرف چنچی چلتی ہے'],

    'plan.title':        ['Journey planner', 'سفر منصوبہ ساز'],
    'plan.origin':       ['Starting from', 'کہاں سے'],
    'plan.destination':  ['Going to', 'کہاں تک'],
    'plan.swap':         ['Swap starting point and destination', 'آغاز اور منزل تبدیل کریں'],
    'plan.chooseMap':    ['Choose on map', 'نقشے پر منتخب کریں'],
    'plan.pickFrom':     ['Choose a starting stop', 'ابتدائی اسٹاپ منتخب کریں'],
    'plan.pickTo':       ['Choose a destination stop', 'منزل کا اسٹاپ منتخب کریں'],
    'plan.cancelPick':   ['Cancel', 'منسوخ کریں'],
    'plan.find':         ['Find journey', 'سفر تلاش کریں'],
    'plan.aiNote':       ['Every step names the stop and explains the change, so you can check it before you travel.',
                          'ہر مرحلہ اسٹاپ اور تبدیلی کی وجہ بتاتا ہے تاکہ سفر سے پہلے آپ تصدیق کر سکیں۔'],
    'plan.total':        ['Total time', 'کل وقت'],
    'plan.fare':         ['Fare', 'کرایہ'],
    'plan.why':          ['Why this journey', 'یہ سفر کیوں'],
    'plan.start':        ['Start journey', 'سفر شروع کریں'],
    'plan.noPlan':       ['No prepared journey for this pair yet. Try Saddar → Gulshan-e-Hadeed or Sea View → Korangi.',
                          'اس جوڑے کے لیے ابھی منصوبہ تیار نہیں۔ سادر تا گلشن ہدید یا سی ویو تا کorangی آزمائیں۔'],
    'plan.alternatives': ['Other journeys', 'دیگر سفر'],
    'plan.step':         ['Step {n}', 'مرحلہ {n}'],
    'plan.board':        ['Board', 'سوار ہوں'],
    'plan.alight':       ['Get off', 'اتریں'],
    'plan.transfer':     ['Change vehicle', 'گاڑی تبدیل کریں'],
    'plan.walk':         ['Walk', 'پیدل'],
    'plan.walkTo':       ['Walk to {n}', '{n} تک پیدل'],
    'plan.started':      ['Journey started — showing each step on the map.', 'سفر شروع — ہر مرحلہ نقشے پر دکھایا جا رہا ہے۔'],

    'safety.title':      ['Safety', 'سیفٹی'],
    'safety.hold':       ['Hold for SOS', 'ایس او ایس کے لیے دبائیں'],
    'safety.holdHelp':   ['Hold for 2 seconds. Your location is sent to the emergency desk and your saved contacts.',
                          '2 سیکنڈ دبائیں۔ آپ کی لوکیشن ہنگامی ڈیسک اور محفوظ رابطوں کو بھیجی جاتی ہے۔'],
    'safety.keepHolding':['Keep holding…', 'دبائے رکھیں…'],
    'safety.countdown':  ['Sending in {n}', '{n} میں بھیجا جا رہا ہے'],
    'safety.cancelSend': ['Cancel this report', 'یہ رپورٹ منسوخ کریں'],
    'safety.sent':       ['Report received', 'رپورٹ موصول ہو گئی'],
    'safety.sentBody':   ['Your report was sent with your live location. Police 15 · Rescue 1122',
                          'آپ کی رپورٹ موجودہ لوکیشن کے ساتھ بھیج دی گئی۔ پولیس 15 · ریسکیو 1122'],
    'safety.canceled':   ['Report cancelled', 'رپورٹ منسوخ ہو گئی'],
    'safety.aborted':     ['Hold was too short — nothing was sent', 'دبائے میں وقت کم تھا — کچھ نہیں بھیجا گیا'],
    'safety.robbery':    ['Complaint', 'شکایت'],
    'safety.subject':    ['Subject', 'عنوان'],
    'safety.desc':       ['Description', 'تفصیل'],
    'safety.evidence':   ['Attach evidence', 'ثبوت ضم کریں'],
    'safety.vehicle':    ['Bus involved (optional)', 'متعلقہ بس (اختیاری)'],
    'safety.send':       ['Submit', 'جمع کریں'],
    'safety.myReports':  ['My reports', 'میری رپورٹس'],
    'safety.shareLoc':   ['Share location with a contact', 'مقام کسی رابطے سے شیئر کریں'],
    'safety.sentShort':  ['Report sent', 'رپورٹ بھیج دی گئی'],

    'review.title':      ['Rate the driver', 'ڈرائیور کو ریٹنگ دیں'],
    'review.tapStars':   ['Tap a star to rate', 'ریٹنگ کے لیے ستارے پر ٹیپ کریں'],
    'review.tags':       ['Quick tags', 'فوری ٹیگز'],
    'review.text':       ['Add a few words', 'چند الفاظ لکھیں'],
    'review.submit':     ['Submit review', 'تبصرہ جمع کریں'],
    'review.thanks':     ['Thanks — your review helps other commuters.', 'شکریہ — آپ کا تبصرہ دوسر مسافروں کے لیے مفید ہے۔'],
    'review.none':       ['No reviews yet', 'ابھی کوئی تبصرہ نہیں'],
    'review.by':         ['by {n}', '{n} کی طرف سے'],

    'more.title':        ['More', 'مزید'],
    'more.language':     ['Language', 'زبان'],
    'more.english':      ['English', 'انگریزی'],
    'more.urdu':         ['Urdu', 'اردو'],
    'more.access':       ['Accessibility', 'رسائی'],
    'more.largeText':    ['Larger text', 'بڑا فونٹ'],
    'more.contrast':     ['High contrast (sunlight)', 'زیادہ کنٹراسٹ (دھوپ)'],
    'more.lightMode':    ['Light mode', 'لائٹ موڈ'],
    'more.evalMode':     ['Evaluation mode', 'ایویلیویشن موڈ'],
    'more.evalHint':     ['Records taps, screen changes and task times for the usability test.',
                          'یوزیبلٹی ٹیسٹ کے لیے ٹیپس، اسکرین بدلیوں اور وقت ریکارڈ کرتا ہے۔'],
    'more.clock':        ['Demo clock speed', 'ڈیمو گھڑی کی رفتار'],
    'more.clockNote':    ['Speed up the simulation to watch buses move and ETAs count down.',
                          'Simulation تیز کریں تاکہ بسیں حرکت کریں اور اوقات گنتے دیکھیں۔'],
    'more.offline':      ['Simulate connection loss', 'کنکشن کٹی کا تجربہ'],
    'more.offlineNote':  ['Shows the last known vehicle position and how old it is.',
                          'گاڑی کا آخری معلوم مقام اور اس کی عمر دکھاتا ہے۔'],
    'more.reset':        ['Reset demo data', 'ڈیمو ڈیٹا ری سیٹ کریں'],
    'more.resetConfirm': ['Reset all demo data (alerts, reports, reviews)?', 'تمام ڈیمو ڈیٹا ری سیٹ کریں؟'],
    'more.about':        ['About this prototype', 'اس پروٹو ٹائپ کے بارے میں'],
    'more.aboutBody':    ['Phase 2 prototype. Vehicle positions, ETAs and union updates are simulated. No real tracker hardware is used.',
                          'فیز 2 پروٹو ٹائپ۔ گاڑیوں کی پوزیشن، اوقات اور یونین اپ ڈیٹس مصنوعی ہیں۔ کوئی اصل ٹریکر استعمال نہیں ہوتا۔'],

    'alerts.title':      ['Service alerts', 'سروس الرٹ'],
    'alerts.none':       ['No service alerts right now', 'اس وقت کوئی سروس الرٹ نہیں'],
    'alerts.by':         ['From {n}', '{n} سے'],
    'alerts.delayBody':  ['{r} is delayed by {n} minutes because of {why}.', '{r} میں {n} منٹ کی تاخیر ہے کیونکہ {why}۔'],
    'alerts.oosBody':    ['{r} vehicle {p} is out of service. {why}', '{r} گاڑی {p} سروس میں نہیں ہے۔ {why}'],
    'alerts.driverBody': ['The driver for {r} ({p}) has been changed. {why}', '{r} ({p}) کے ڈرائیور کو تبدیل کر دیا گیا ہے۔ {why}'],
    'alerts.recent':     ['Updated {n} min ago', '{n} منٹ پہلے اپ ڈیٹ'],

    'union.title':       ['Union Operations Portal', 'یونین آپریشنز پورٹل'],
    'union.sub':         ['Route, vehicle and driver data for unions', 'یونین کے لیے روٹ، گاڑی اور ڈرائیور ڈیٹا'],
    'union.fleet':       ['Fleet', 'گاڑیاں'],
    'union.alerts':      ['Alerts', 'الرٹس'],
    'union.reports':     ['SOS & complaints', 'ایس او ایس اور شکایات'],
    'union.reportsNote': ['Reports submitted by commuters', 'مسافروں کی بھیجی ہوئی رپورٹس'],
    'union.sosReport':   ['SOS alert', 'ایس او ایس الرٹ'],
    'union.complaint':   ['Complaint', 'شکایت'],
    'union.associatedBus': ['Associated bus', 'متعلقہ بس'],
    'union.noBusLinked': ['No bus specified', 'بس کی نشاندہی نہیں کی گئی'],
    'union.noReports':   ['No SOS alerts or complaints have been submitted.', 'ابھی کوئی ایس او ایس الرٹ یا شکایت موصول نہیں ہوئی۔'],
    'union.settings':    ['Settings', 'ترتیبات'],
    'union.preview':     ['Commuter app preview', 'کمیوٹر ایپ پیش نظارہ'],
    'union.status':      ['Set vehicle status', 'گاڑی کی حالت مقرر کریں'],
    'union.running':     ['Running', 'چل رہی ہے'],
    'union.delayed':     ['Delayed', 'دیر'],
    'union.oos':         ['Out of service', 'سروس میں نہیں'],
    'union.delayMin':    ['Delay (minutes)', 'تاخیر (منٹ)'],
    'union.reassign':    ['Reassign driver', 'ڈرائیور تبدیل کریں'],
    'union.note':        ['Note to commuters', 'مسافرین کے لیے نوٹ'],
    'union.publish':     ['Publish update', 'اپ ڈیٹ شائع کریں'],
    'union.published':   ['Published. Commuters see it now.', 'شائع ہو گیا۔ مسافر اب دیکھ سکتے ہیں۔'],
    'union.manualEdit':  ['Update a vehicle by hand', 'گاڑی کی اپ ڈیٹ دستی طور پر کریں'],
    'union.manualEditNote': ['Drivers phone the union; there is no app to log a call from. Pick the vehicle, set its status, delay, driver and note, then publish. The commuter app shows it in about a second.',
                             'ڈرائیور یونین کو فون کرتے ہیں؛ کال ریکارڈ کرنے کی ایپ نہیں۔ گاڑی منتخب کریں، اس کی حالت، تاخیر، ڈرائیور اور نوٹ لکھیں، پھر شائع کریں۔ کمیوٹر ایپ تقریباً ایک سیکنڈ میں دکھا دیتی ہے۔'],
    'union.selectVehicle': ['Select a vehicle to update it', 'اپ ڈیٹ کرنے کے لیے گاڑی منتخب کریں'],
    'union.pointOfTruth': ['Operator is the source of truth', 'آپریٹر ہی اصل معلومات کا ذریعہ ہے'],
    'union.all':         ['All', 'سب'],
    'union.bus':         ['Bus', 'بس'],
    'union.chinchi':     ['Chinchi', 'چنچی'],
    'union.delayedOnly': ['Delayed', 'دیر'],
    'union.oosOnly':    ['Out of service', 'سروس میں نہیں'],
    'union.driver':      ['Driver', 'ڈرائیور'],
    'union.plate':       ['Plate', 'پلیٹ'],
    'union.route':       ['Route', 'روٹ'],
    'union.vehicle':     ['Vehicle', 'گاڑی'],
    'union.lastUpdate':  ['Last update', 'آخری اپ ڈیٹ'],
    'union.noAlerts':    ['No alerts published yet', 'ابھی کوئی الرٹ شائع نہیں ہوا'],
    'union.operator':    ['Operator', 'اپریٹر'],
    'union.union':       ['Union', 'یونین'],
    'union.driversNote': ['A vehicle keeps one driver unless the union changes it here.',
                          'گاڑی کا ایک ڈرائیور رہتا ہے جب تک یونین یہاں تبدیلی نہ کرے۔']
  };

  var lang = 'en';

  function t(key, vars) {
    var entry = STRINGS[key];
    if (!entry) return key;
    var s = entry[lang === 'ur' ? 1 : 0];
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return s;
  }

  function setLang(l) {
    lang = (l === 'ur') ? 'ur' : 'en';
    KTA.store.update(function (s) { s.settings.lang = lang; });
    apply();
    return lang;
  }

  function getLang() { return lang; }

  /* translate every [data-i18n] node in the document */
  function apply(scope) {
    var doc = scope || (typeof document !== 'undefined' ? document : null);
    if (!doc) return;
    var nodes = doc.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-i18n');
      var val = t(key);
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        attr.split(',').forEach(function (a) {
          a = a.trim();
          if (a) el.setAttribute(a, val);
        });
      } else {
        el.textContent = val;
      }
    }
    var ph = doc.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < ph.length; j++) {
      ph[j].setAttribute('placeholder', t(ph[j].getAttribute('data-i18n-placeholder')));
    }
    var rtl = lang === 'ur';
    if (doc.documentElement) {
      doc.documentElement.setAttribute('lang', lang);
      doc.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    }
    if (doc.body) doc.body.classList.toggle('rtl', rtl);
    try { document.title = t('app.name') + ' — ' + t('app.tagline'); } catch (e) {}
  }

  KTA.i18n = { t: t, setLang: setLang, getLang: getLang, apply: apply, STRINGS: STRINGS };
  if (typeof module !== 'undefined' && module.exports) module.exports = KTA.i18n;
})(typeof window !== 'undefined' ? window : globalThis);
