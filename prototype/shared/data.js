/* ============================================================================
 * Karachi Transit App — Simulated transit dataset (Phase 2 prototype)
 * ----------------------------------------------------------------------------
 * All service data here is SIMULATED. Major landmark labels were checked
 * against Google Maps; informal pickup points and map positions remain
 * approximate, and do not represent verified transit stops or GPS coordinates.
 * Route corridors follow well-known Karachi corridors but are simplified.
 * Replace with union-provided data in Phase 3 if available.
 *
 * Coordinate system: schematic 1000 x 640 projection of checked landmark pins
 * and approximate area centers. Map units are not GPS coordinates.
 * ==========================================================================*/
(function (root) {
  'use strict';
  var KTA = (root.KTA = root.KTA || {});

  /* ------------------------------------------------------------------ stops
   * kind: 'formal'   = signed bus stop / interchange
   *       'informal' = chinchi point identified by a landmark (F6)
   * photo: key into KTA.assets.landmarkSVG()
   */
  var STOPS = [
    /* --- bus stops (formal) --- */
    { id: 'st_jpo',       name: 'Saddar GPO', ur: 'صدر جی پی او', area: 'Saddar',
      kind: 'formal', mode: 'bus', x: 97, y: 345, landmark: 'Saddar General Post Office', landmarkUr: 'صدر جنرل پوسٹ آفس', photo: 'office' },
    { id: 'st_empress',   name: 'Empress Market', ur: 'ایمپریس مارکیٹ', area: 'Saddar',
      kind: 'formal', mode: 'bus', x: 99, y: 335, landmark: 'Empress Market main entrance', landmarkUr: 'ایمپریس مارکیٹ داخلی راستہ', photo: 'market' },
    { id: 'st_chund',     name: 'I.I. Chundrigar Road', ur: 'آئی آئی چندریگر روڈ', area: 'CBD',
      kind: 'formal', mode: 'bus', x: 8, y: 376, landmark: 'KPT Head Office', landmarkUr: 'کے پی ٹی ہیڈ آفس', photo: 'office' },
    { id: 'st_ned',       name: 'NED University', ur: 'این ای ڈی یونیورسٹی', area: 'University Road',
      kind: 'formal', mode: 'bus', x: 331, y: 173, landmark: 'NED main gate', landmarkUr: 'این ای ڈی مین گیٹ', photo: 'gate' },
    { id: 'st_liaq',      name: 'Liaquatabad (Nimco)', ur: 'لیاقت آباد (نمکو)', area: 'Liaquatabad',
      kind: 'formal', mode: 'bus', x: 144, y: 234, landmark: 'Liaquatabad Nimco area', landmarkUr: 'لیاقت آباد نمکو کا علاقہ', photo: 'chowk' },
    { id: 'st_gol',       name: 'Gol Market, Nazimabad', ur: 'گول مارکیٹ، ناظم آباد', area: 'Nazimabad',
      kind: 'formal', mode: 'bus', x: 90, y: 210, landmark: 'Gol Market, Nazimabad', landmarkUr: 'گول مارکیٹ، ناظم آباد', photo: 'market' },
    { id: 'st_nazimabad', name: 'Nazimabad No. 4 area', ur: 'ناظم آباد نمبر ۴ کا علاقہ', area: 'Nazimabad',
      kind: 'formal', mode: 'bus', x: 121, y: 206, landmark: 'Approximate Nazimabad No. 4 area', landmarkUr: 'ناظم آباد نمبر ۴ کا اندازاً علاقہ', photo: 'chowk' },
    { id: 'st_north',     name: 'Five Star Chowrangi, North Nazimabad', ur: 'فائیو اسٹار چورنگی، نارتھ ناظم آباد', area: 'North Nazimabad',
      kind: 'formal', mode: 'bus', x: 151, y: 141, landmark: 'Five Star Chowrangi', landmarkUr: 'فائیو اسٹار چورنگی', photo: 'chowk' },
    { id: 'st_sf',        name: 'Hasan Square', ur: 'حسن اسکوائر', area: 'Gulshan-e-Iqbal',
      kind: 'formal', mode: 'bus', x: 218, y: 240, landmark: 'Hasan Square area', landmarkUr: 'حسن اسکوائر کا علاقہ', photo: 'flyover' },
    { id: 'st_qai',       name: 'Shahrah-e-Faisal (Airport Corridor)', ur: 'شاہراہ فیصل (ایئرپورٹ کوریڈور)', area: 'Airport Corridor',
      kind: 'formal', mode: 'bus', x: 408, y: 266, landmark: 'Approximate airport-bound Shahrah-e-Faisal corridor', landmarkUr: 'شاہراہ فیصل پر ایئرپورٹ کی سمت کا اندازاً راستہ', photo: 'flyover' },
    { id: 'st_airport',   name: 'Jinnah International Airport', ur: 'جناح انٹرنیشنل ایئرپورٹ', area: 'Airport',
      kind: 'formal', mode: 'bus', x: 469, y: 244, landmark: 'Airport terminal access road', landmarkUr: 'ایئرپورٹ ٹرمینل تک رسائی کی سڑک', photo: 'terminal' },
    { id: 'st_clifton',   name: 'Clifton', ur: 'کلفٹن', area: 'Clifton',
      kind: 'formal', mode: 'bus', x: 92, y: 426, landmark: 'Clifton near Sea Breeze Centre', landmarkUr: 'سی بریز سینٹر کے قریب کلفٹن', photo: 'beach' },
    { id: 'st_seaview',   name: 'Sea View Beach', ur: 'سی ویو بیچ', area: 'Sea View',
      kind: 'formal', mode: 'bus', x: 49, y: 485, landmark: 'Sea View beachfront', landmarkUr: 'سی ویو ساحل', photo: 'beach' },
    { id: 'st_pechs',     name: 'PECHS Block 6', ur: 'پی ایچ ایس بلاک 6', area: 'PECHS',
      kind: 'formal', mode: 'bus', x: 203, y: 334, landmark: 'PECHS Block 6 area', landmarkUr: 'پی ای سی ایچ ایس بلاک ۶ کا علاقہ', photo: 'office' },
    { id: 'st_bahadur',   name: 'Bahadurabad Chowrangi', ur: 'بہادرآباد چورنگی', area: 'Bahadurabad',
      kind: 'formal', mode: 'bus', x: 197, y: 295, landmark: 'Bahadurabad Chowrangi', landmarkUr: 'بہادرآباد چورنگی', photo: 'chowk' },
    { id: 'st_uni',       name: 'University Road (Nipa Stop)', ur: 'یونیورسٹی روڈ (نیپا اسٹاپ)', area: 'University Road',
      kind: 'formal', mode: 'bus', x: 282, y: 202, landmark: 'NIPA Chowrangi bus stop', landmarkUr: 'نیپا چورنگی بس اسٹاپ', photo: 'gate' },
    { id: 'st_gulshan',   name: 'Gulshan-e-Hadeed', ur: 'گلشنِ حدید', area: 'Gulshan-e-Hadeed',
      kind: 'formal', mode: 'bus', x: 984, y: 323, landmark: 'Gulshan-e-Hadeed area', landmarkUr: 'گلشنِ حدید کا علاقہ', photo: 'chowk' },
    { id: 'st_fedb',      name: 'Federal B Area', ur: 'فیڈرل بی ایریا', area: 'Federal B Area',
      kind: 'formal', mode: 'bus', x: 205, y: 188, landmark: 'Federal B Area', landmarkUr: 'فیڈرل بی ایریا', photo: 'office' },
    { id: 'st_korangi',   name: 'Korangi No. 4', ur: 'کورنگی نمبر ۴', area: 'Korangi',
      kind: 'formal', mode: 'bus', x: 442, y: 425, landmark: 'Korangi No. 4 area', landmarkUr: 'کورنگی نمبر ۴ کا علاقہ', photo: 'chowk' },
    { id: 'st_malir',     name: 'Malir Halt', ur: 'مالر ہالٹ', area: 'Malir',
      kind: 'formal', mode: 'bus', x: 488, y: 284, landmark: 'Malir Halt bus stop', landmarkUr: 'ملیر ہالٹ بس اسٹاپ', photo: 'gate' },

    /* --- chinchi points (informal, landmark-based) --- */
    { id: 'st_ghanta',    name: 'Merewether Clock Tower', ur: 'میری ویدر کلاک ٹاور', area: 'Seari Quarters',
      kind: 'informal', mode: 'chinchi', x: 19, y: 372, landmark: 'Merewether Clock Tower', landmarkUr: 'میری ویدر کلاک ٹاور', photo: 'clock' },
    { id: 'st_kmc',       name: 'KMC Office Chowk', ur: 'کی ایم سی آفس چوراکہ', area: 'Saddar',
      kind: 'informal', mode: 'chinchi', x: 50, y: 354, landmark: 'Karachi Metropolitan Corporation Building', landmarkUr: 'کراچی میٹروپولیٹن کارپوریشن کی عمارت', photo: 'office' },
    { id: 'st_seabreeze', name: 'Sea Breeze Centre', ur: 'سی بریز سینٹر', area: 'Clifton',
      kind: 'informal', mode: 'chinchi', x: 97, y: 427, landmark: 'Sea Breeze Centre, Clifton', landmarkUr: 'سی بریز سینٹر، کلفٹن', photo: 'beach' },
    { id: 'st_askari',    name: 'Do Darya', ur: 'دو دریا', area: 'DHA Phase 8',
      kind: 'informal', mode: 'chinchi', x: 255, y: 614, landmark: 'Do Darya', landmarkUr: 'دو دریا', photo: 'chowk' },
    { id: 'st_svr',       name: 'Sea View Road (chinchi point)', ur: 'سی ویو روڈ (چنچی پوائنٹ)', area: 'Sea View',
      kind: 'informal', mode: 'chinchi', x: 66, y: 485, landmark: 'Approximate Sea View Road pickup area', landmarkUr: 'سی ویو روڈ پر اندازاً پک اَپ کا علاقہ', photo: 'beach' },
    { id: 'st_nipa',      name: 'NIPA Chowrangi (chinchi point)', ur: 'نیپا چورنگی (چنچی پوائنٹ)', area: 'University Road',
      kind: 'informal', mode: 'chinchi', x: 285, y: 203, landmark: 'NIPA Chowrangi', landmarkUr: 'نیپا چورنگی', photo: 'shop' },
    { id: 'st_peshwari',  name: 'Peshawari Ice Cream, Bahadurabad', ur: 'پشاوری آئس کریم، بہادرآباد', area: 'Bahadurabad',
      kind: 'informal', mode: 'chinchi', x: 205, y: 289, landmark: 'Approximate Peshawari Ice Cream area', landmarkUr: 'پشاوری آئس کریم کا اندازاً علاقہ', photo: 'shop' },
    { id: 'st_pechs2',    name: 'PECHS Block 2', ur: 'پی ای سی ایچ ایس بلاک ۲', area: 'PECHS',
      kind: 'informal', mode: 'chinchi', x: 192, y: 330, landmark: 'PECHS Block 2 area', landmarkUr: 'پی ای سی ایچ ایس بلاک ۲ کا علاقہ', photo: 'market' },
    { id: 'st_bhattigate',name: 'Regal Chowk, Saddar', ur: 'ریگل چوک، صدر', area: 'Saddar',
      kind: 'informal', mode: 'chinchi', x: 90, y: 344, landmark: 'Regal Chowk (approximate pickup area)', landmarkUr: 'ریگل چوک (اندازاً پک اَپ کا علاقہ)', photo: 'gate' },
    { id: 'st_newkhi',    name: 'New Karachi (railway-side area)', ur: 'نیو کراچی (ریلوے کے قریب کا علاقہ)', area: 'New Karachi',
      kind: 'informal', mode: 'chinchi', x: 158, y: 25, landmark: 'Approximate New Karachi area near the railway', landmarkUr: 'ریلوے کے قریب نیو کراچی کا اندازاً علاقہ', photo: 'gate' }
  ];

  /* ----------------------------------------------------------------- routes
   * path: waypoints in map units. Stops are projected onto the path at runtime,
   * so a stop shared by two routes (PECHS, University Road) always sits on
   * both lines.
   */
  var ROUTES = [
    { id: 'r_b13', number: 'B13', type: 'bus', name: 'Sea View → Gulshan-e-Hadeed', ur: 'سی ویو تا گلشن ہدید',
      operator: 'Karachi Bus Route Association (KBRA)', track: 'live', headwayMin: 12, speedKmh: 24, fare: 30,
      path: [[49,485],[92,426],[150,380],[203,334],[197,295],[240,245],[282,202],[480,220],[720,270],[984,323]],
      stopIds: ['st_seaview','st_clifton','st_pechs','st_bahadur','st_uni','st_gulshan'] },

    { id: 'r_b21', number: 'B21', type: 'bus', name: 'Saddar → Korangi', ur: 'سادر تا کorangی',
      operator: 'Karachi Bus Route Association (KBRA)', track: 'live', headwayMin: 15, speedKmh: 22, fare: 25,
      path: [[97,345],[8,376],[100,360],[203,334],[205,188],[300,260],[442,425]],
      stopIds: ['st_jpo','st_chund','st_pechs','st_fedb','st_korangi'] },

    { id: 'r_b1', number: 'B1', type: 'bus', name: 'NED University → North Nazimabad', ur: 'این ای ڈی یونیورسٹی تا نارتھ ناظم آباد',
      operator: 'Karachi Bus Route Association (KBRA)', track: 'live', headwayMin: 20, speedKmh: 20, fare: 20,
      path: [[331,173],[144,234],[90,210],[121,206],[151,141]],
      stopIds: ['st_ned','st_liaq','st_gol','st_nazimabad','st_north'] },

    { id: 'r_b5', number: 'B5', type: 'bus', name: 'Saddar → Airport', ur: 'سادر تا ایئرپورٹ',
      operator: 'Karachi Bus Route Association (KBRA)', track: 'estimated', headwayMin: 25, speedKmh: 21, fare: 25,
      path: [[97,345],[99,335],[218,240],[330,250],[408,266],[469,244]],
      stopIds: ['st_jpo','st_empress','st_sf','st_qai','st_airport'] },

    { id: 'r_b22', number: 'B22', type: 'bus', name: 'Gulshan-e-Hadeed → Malir Halt', ur: 'گلشن ہدید تا مالر ہالٹ',
      operator: 'WASA Bus Service / Private Operators', track: 'live', headwayMin: 30, speedKmh: 25, fare: 35,
      path: [[984,323],[720,250],[488,284],[330,230],[282,202],[205,188]],
      stopIds: ['st_gulshan','st_uni','st_fedb','st_malir'] },

    { id: 'r_c1', number: 'C1', type: 'chinchi', name: 'Chinchi: Merewether Clock Tower → Sea View', ur: 'چنچی: میری ویدر کلاک ٹاور تا سی ویو',
      operator: 'Sindh Chinchi Drivers Union (SCDU)', track: 'estimated', headwayMin: 6, speedKmh: 17, fare: 40,
      path: [[19,372],[50,354],[97,427],[160,510],[255,614],[160,550],[66,485]],
      stopIds: ['st_ghanta','st_kmc','st_seabreeze','st_askari','st_svr'] },

    { id: 'r_c2', number: 'C2', type: 'chinchi', name: 'Chinchi: University Road → PECHS', ur: 'چنچی: یونیورسٹی روڈ تا پی ایچ ایس',
      operator: 'Sindh Chinchi Drivers Union (SCDU)', track: 'estimated', headwayMin: 8, speedKmh: 16, fare: 35,
      path: [[285,203],[205,289],[192,330]],
      stopIds: ['st_nipa','st_peshwari','st_pechs2'] },

    { id: 'r_c3', number: 'C3', type: 'chinchi', name: 'Chinchi: Saddar → New Karachi', ur: 'چنچی: صدر تا نیو کراچی',
      operator: 'Sindh Chinchi Drivers Union (SCDU)', track: 'estimated', headwayMin: 7, speedKmh: 18, fare: 45,
      path: [[19,372],[90,344],[90,210],[151,141],[158,25]],
      stopIds: ['st_ghanta','st_bhattigate','st_gol','st_north','st_newkhi'] }
  ];

  /* --------------------------------------------------------------- vehicles
   * One driver per vehicle (assumption). phase = position along route at
   * sim epoch, speed = fraction of route covered per minute.
   * status can be overridden at runtime by the union portal.
   */
  var VEHICLES = [
    { id: 'v_b13_1', routeId: 'r_b13', plate: 'KHI-8871', model: 'Volvo B7R bus', capacity: 48, occupancy: 0.7,
      driver: { name: 'Nadeem Khan', ur: 'نعیم خان', phone: '0300-7781234', cnic: '42101-*******-3' }, phase: 0.08, speed: 0.028, tripNo: 12 },
    { id: 'v_b13_2', routeId: 'r_b13', plate: 'KHI-9014', model: 'Yutong bus', capacity: 45, occupancy: 0.9,
      driver: { name: 'Arshad Mehmood', ur: 'ارشد محمود', phone: '0321-3340987', cnic: '42201-*******-9' }, phase: 0.62, speed: 0.026, tripNo: 27 },
    { id: 'v_b13_3', routeId: 'r_b13', plate: 'LEB-2210', model: 'Shehzad bus', capacity: 40, occupancy: 0.4,
      driver: { name: 'Faizan Ali', ur: 'فیضان علی', phone: '0333-5567890', cnic: '42301-*******-1' }, phase: 0.41, speed: 0.027, tripNo: 9 },

    { id: 'v_b21_1', routeId: 'r_b21', plate: 'KHI-4455', model: 'Hino bus', capacity: 44, occupancy: 0.8,
      driver: { name: 'Rashid Bhatti', ur: 'رشید بھٹی', phone: '0345-9901122', cnic: '42401-*******-5' }, phase: 0.15, speed: 0.031, tripNo: 6 },
    { id: 'v_b21_2', routeId: 'r_b21', plate: 'KHI-6632', model: 'Volvo B7R bus', capacity: 48, occupancy: 0.5,
      driver: { name: 'Imran Shaikh', ur: 'عمران شیخ', phone: '0301-2234455', cnic: '42501-*******-7' }, phase: 0.55, speed: 0.030, tripNo: 19 },
    { id: 'v_b21_3', routeId: 'r_b21', plate: 'LEB-7788', model: 'Hino bus', capacity: 44, occupancy: 0.95,
      driver: { name: 'Salman Gul', ur: 'سلمان گل', phone: '0312-6677889', cnic: '42601-*******-2' }, phase: 0.77, speed: 0.029, tripNo: 31 },

    { id: 'v_b1_1', routeId: 'r_b1', plate: 'KHI-3301', model: 'Fuso bus', capacity: 42, occupancy: 0.6,
      driver: { name: 'Javed Iqbal', ur: 'جاوید اقبال', phone: '0334-8877665', cnic: '42701-*******-4' }, phase: 0.22, speed: 0.035, tripNo: 4 },
    { id: 'v_b1_2', routeId: 'r_b1', plate: 'KHI-1199', model: 'Fuso bus', capacity: 42, occupancy: 0.85,
      driver: { name: 'Kashif Raza', ur: 'کاشف رضا', phone: '0308-5544332', cnic: '42801-*******-6' }, phase: 0.71, speed: 0.033, tripNo: 17 },

    { id: 'v_b5_1', routeId: 'r_b5', plate: 'KHI-7702', model: 'Hino bus', capacity: 44, occupancy: 0.7,
      driver: { name: 'Tanveer Ahmed', ur: 'طنویر احمد', phone: '0346-1122334', cnic: '42901-*******-8' }, phase: 0.3, speed: 0.032, tripNo: 11 },

    { id: 'v_b22_1', routeId: 'r_b22', plate: 'KHI-5567', model: 'Volvo B7R bus', capacity: 48, occupancy: 0.35,
      driver: { name: 'Zulfiqar Ali', ur: 'ذلفیقار علی', phone: '0306-4455667', cnic: '43001-*******-0' }, phase: 0.45, speed: 0.026, tripNo: 8 },

    { id: 'v_c1_1', routeId: 'r_c1', plate: 'CH-1121', model: 'Sazgar auto rickshaw', capacity: 3, occupancy: 0.7,
      driver: { name: 'Shoaib Ali', ur: 'شعیب علی', phone: '0311-2233445', cnic: '43101-*******-3' }, phase: 0.25, speed: 0.055, tripNo: 22 },
    { id: 'v_c1_2', routeId: 'r_c1', plate: 'CH-4488', model: 'Sazgar auto rickshaw', capacity: 3, occupancy: 0.3,
      driver: { name: 'Muzammil Haq', ur: 'مظاہل حق', phone: '0322-5566778', cnic: '43201-*******-5' }, phase: 0.66, speed: 0.052, tripNo: 31 },
    { id: 'v_c2_1', routeId: 'r_c2', plate: 'CH-7742', model: 'Sazgar auto rickshaw', capacity: 3, occupancy: 0.5,
      driver: { name: 'Adnan Khan', ur: 'عندن خان', phone: '0335-6677889', cnic: '43301-*******-7' }, phase: 0.4, speed: 0.058, tripNo: 14 },
    { id: 'v_c3_1', routeId: 'r_c3', plate: 'CH-9090', model: 'Sazgar auto rickshaw', capacity: 3, occupancy: 0.6,
      driver: { name: 'Yasir Nawaz', ur: 'یاسر نواز', phone: '0309-9988776', cnic: '43401-*******-9' }, phase: 0.5, speed: 0.054, tripNo: 18 }
  ];

  /* ---------------------------------------------------------- journey plans
   * The AI planner is simulated: origin/destination are matched to a prepared
   * plan. Each step names the stop and explains WHY the transfer happens
   * (explainability / IR6 + F9).
   */
  var PLANS = [
    {
      id: 'plan_saddar_gulshan', from: 'st_jpo', to: 'st_gulshan',
      title: 'Saddar → Gulshan-e-Hadeed', titleUr: 'سادر تا گلشن ہدید', totalMin: 62, walkMin: 4, cost: 60,
      steps: [
        { kind: 'board', mode: 'bus', routeId: 'r_b21', vehicle: 'B21', fromStop: 'st_jpo', toStop: 'st_pechs',
          min: 22, fare: 25, reasonEn: 'B21 is the only route from Saddar that reaches PECHS.', reasonUr: 'سادر سے پی ایچ ایس تک جانے والی واحد بس B21 ہے۔' },
        { kind: 'transfer', atStop: 'st_pechs', min: 6,
          reasonEn: 'Change at PECHS Block 6 — B13 stops on the same bay, so no walking needed.',
          reasonUr: 'پی ایچ ایس بلاک 6 پر تبدیلی کریں — B13 بھی اسی بے پر رکتی ہے، walking درکار نہیں۔' },
        { kind: 'board', mode: 'bus', routeId: 'r_b13', vehicle: 'B13', fromStop: 'st_pechs', toStop: 'st_gulshan',
          min: 30, fare: 30, reasonEn: 'B13 runs straight to Gulshan-e-Hadeed with no further change.',
          reasonUr: 'B13 براہ راست گلشن ہدید جاتی ہے، مزید تبدیلی نہیں۔' },
        { kind: 'walk', min: 4, toStop: 'st_gulshan', reasonEn: '2 minute walk from the bus bay to the destination.',
          reasonUr: 'بس بے سے منزل تک 2 منٹ کا فاصلہ۔' }
      ]
    },
    {
      id: 'plan_seaview_korangi', from: 'st_seaview', to: 'st_korangi',
      title: 'Sea View → Korangi', titleUr: 'سی ویو تا کorangی', totalMin: 74, walkMin: 6, cost: 55,
      steps: [
        { kind: 'board', mode: 'bus', routeId: 'r_b13', vehicle: 'B13', fromStop: 'st_seaview', toStop: 'st_pechs',
          min: 26, fare: 30, reasonEn: 'B13 is the only bus that serves Sea View.', reasonUr: 'سی ویو صرف B13 کے پاس سے گزرتی ہے۔' },
        { kind: 'transfer', atStop: 'st_pechs', min: 8,
          reasonEn: 'Change to B21 at PECHS — the two routes share the same stop.',
          reasonUr: 'پی ایچ ایس پر B21 میں تبدیلی کریں — دونوں لائنوں کا اسٹاپ ایک ہی ہے۔' },
        { kind: 'board', mode: 'bus', routeId: 'r_b21', vehicle: 'B21', fromStop: 'st_pechs', toStop: 'st_korangi',
          min: 28, fare: 25, reasonEn: 'B21 goes directly to Korangi Area 4.', reasonUr: 'B21 براہ راست کorangی ایریا 4 جاتی ہے۔' },
        { kind: 'walk', min: 6, toStop: 'st_korangi', reasonEn: '4 minute walk from the stop to the office gate.',
          reasonUr: 'اسٹاپ سے دفتر گیٹ تک 4 منٹ۔' }
      ]
    },
    {
      id: 'plan_ned_airport', from: 'st_ned', to: 'st_airport',
      title: 'NED University → Airport', titleUr: 'این ای ڈی یونیورسٹی تا ایئرپورٹ', totalMin: 41, walkMin: 3, cost: 25,
      steps: [
        { kind: 'board', mode: 'bus', routeId: 'r_b5', vehicle: 'B5', fromStop: 'st_ned', toStop: 'st_airport',
          min: 38, fare: 25, reasonEn: 'One bus covers the whole trip — no transfer needed.',
          reasonUr: 'پورے سفر کے لیے ایک ہی بس کافی ہے، تبدیلی نہیں۔' },
        { kind: 'walk', min: 3, toStop: 'st_airport', reasonEn: 'Terminal approach road to the terminal gate.',
          reasonUr: 'ٹرمینل اپروچ روڈ سے ٹرمینل گیٹ تک۔' }
      ]
    },
    {
      id: 'plan_ghanta_clifton', from: 'st_ghanta', to: 'st_clifton',
      title: 'Merewether Clock Tower → Clifton (chinchi)', titleUr: 'میری ویدر کلاک ٹاور تا کلفٹن (چنچی)', totalMin: 18, walkMin: 2, cost: 40,
      steps: [
        { kind: 'board', mode: 'chinchi', routeId: 'r_c1', vehicle: 'C1', fromStop: 'st_ghanta', toStop: 'st_seabreeze',
          min: 14, fare: 40, reasonEn: 'C1 runs on this corridor all day and is the fastest option for a short trip.',
          reasonUr: 'C1 تمام دن اسی راستے پر چلتی ہے اور مختصر سفر کے لیے تیز ہے۔' },
        { kind: 'walk', min: 2, toStop: 'st_clifton', reasonEn: 'Short walk to the Clifton stop.', reasonUr: 'کلیفٹن اسٹاپ تک مختصر فاصلہ۔' }
      ]
    },
    {
      id: 'plan_uni_malir', from: 'st_uni', to: 'st_malir',
      title: 'University Road → Malir Halt', titleUr: 'یونیورسٹی روڈ تا مالر ہالٹ', totalMin: 58, walkMin: 4, cost: 35,
      steps: [
        { kind: 'board', mode: 'bus', routeId: 'r_b22', vehicle: 'B22', fromStop: 'st_uni', toStop: 'st_malir',
          min: 54, fare: 35, reasonEn: 'B22 starts near University Road and reaches Malir Halt directly.',
          reasonUr: 'B22 یونیورسٹی روڈ کے قریب شروع ہوتی ہے اور مالر ہالٹ تک براہ راست جاتی ہے۔' },
        { kind: 'walk', min: 4, toStop: 'st_malir', reasonEn: 'Walk from the halt gate to the destination.', reasonUr: 'ہالٹ گیٹ سے منزل تک پیدل۔' }
      ]
    },
    {
      id: 'plan_jpo_north', from: 'st_jpo', to: 'st_north',
      title: 'Saddar → Five Star Chowrangi, North Nazimabad', titleUr: 'صدر تا فائیو اسٹار چورنگی، نارتھ ناظم آباد', totalMin: 34, walkMin: 3, cost: 45,
      steps: [
        { kind: 'walk', min: 3, toStop: 'st_bhattigate', reasonEn: 'Walk from Saddar GPO to the Regal Chowk pickup point.',
          reasonUr: 'صدر جی پی او سے ریگل چوک پک اَپ پوائنٹ تک پیدل جائیں۔' },
        { kind: 'board', mode: 'chinchi', routeId: 'r_c3', vehicle: 'C3', fromStop: 'st_bhattigate', toStop: 'st_north',
          min: 31, fare: 45, reasonEn: 'C3 serves Five Star Chowrangi in North Nazimabad.',
          reasonUr: 'C3 نارتھ ناظم آباد میں فائیو اسٹار چورنگی تک جاتی ہے۔' }
      ]
    }
  ];

  /* ------------------------------------------------------------ union side */
  var UNIONS = [
    { id: 'u_kbra', name: 'Karachi Bus Route Association', short: 'KBRA', nameUr: 'کراچی بس روٹ ایسوسی ایشن',
      routes: ['r_b13', 'r_b21', 'r_b1', 'r_b5'], operator: 'Mr. Qureshi', operatorUr: 'مسٹر قریشی', phone: '021-3790****' },
    { id: 'u_scdu', name: 'Sindh Chinchi Drivers Union', short: 'SCDU', nameUr: 'سندھ چنچی ڈرائیورز یونین',
      routes: ['r_c1', 'r_c2', 'r_c3'], operator: 'Mr. Qureshi', operatorUr: 'مسٹر قریشی', phone: '021-3790****' },
    { id: 'u_wasa', name: 'WASA Bus Service', short: 'WASA', nameUr: 'واسا بس سروس',
      routes: ['r_b22'], operator: 'Mr. Qureshi', operatorUr: 'مسٹر قریشی', phone: '021-3790****' }
  ];

  /* Seeded reviews so the review screen is not empty */
  var REVIEWS = [
    { id: 'rv_1', targetType: 'driver', targetId: 'v_b13_1', author: 'Ayesha K.', rating: 5, tags: ['on_time', 'safe_driving'],
      text: 'Driver stops at every stop and waits for me to sit down.', at: -1000 * 60 * 60 * 26 },
    { id: 'rv_2', targetType: 'driver', targetId: 'v_b21_3', author: 'Bilal R.', rating: 3, tags: ['crowded', 'late'],
      text: 'Bus was late and very crowded in the afternoon.', at: -1000 * 60 * 60 * 9 },
    { id: 'rv_3', targetType: 'driver', targetId: 'v_c1_1', author: 'Sana M.', rating: 4, tags: ['friendly', 'short_wait'],
      text: 'Good behaviour, asked me to sit properly.', at: -1000 * 60 * 60 * 50 },
    { id: 'rv_4', targetType: 'driver', targetId: 'v_b1_1', author: 'Kamran T.', rating: 2, tags: ['rude', 'overcharged'],
      text: 'Charged double and was rude when I asked.', at: -1000 * 60 * 60 * 30 },
    { id: 'rv_5', targetType: 'vehicle', targetId: 'v_b13_2', author: 'Hina W.', rating: 4, tags: ['clean', 'ac'],
      text: 'Bus was clean and had working AC.', at: -1000 * 60 * 60 * 72 }
  ];

  var REVIEW_TAGS = [
    { id: 'on_time', en: 'On time', ur: 'وقت پر' },
    { id: 'safe_driving', en: 'Safe driving', ur: 'محفوظ ڈرائیونگ' },
    { id: 'friendly', en: 'Friendly', ur: 'پیارے' },
    { id: 'clean', en: 'Clean', ur: 'صاف ستھرا' },
    { id: 'ac', en: 'AC working', ur: 'اے سی چل رہا ہے' },
    { id: 'short_wait', en: 'Short wait', ur: 'کم انتظار' },
    { id: 'crowded', en: 'Too crowded', ur: 'بہت بھیڑ' },
    { id: 'late', en: 'Always late', ur: 'ہمیشہ دیر' },
    { id: 'rude', en: 'Rude behaviour', ur: 'برا سلوک' },
    { id: 'overcharged', en: 'Overcharged', ur: 'زیادہ پیسے لیے' }
  ];

  /* ---------------------------------------------------------- commuter places
   * Saved places for the "Recognition rather than recall" requirement (IR1).
   */
  var PLACES = [
    { id: 'pl_home', type: 'home', en: 'Home', ur: 'گھر', stopId: 'st_jpo' },
    { id: 'pl_work', type: 'work', en: 'Work', ur: 'دفتر', stopId: 'st_pechs' },
    { id: 'pl_campus', type: 'custom', en: 'University', ur: 'یونیورسٹی', stopId: 'st_ned' }
  ];
  KTA.data = {
    STOPS: STOPS, ROUTES: ROUTES, VEHICLES: VEHICLES, PLANS: PLANS,
    UNIONS: UNIONS, REVIEWS: REVIEWS, REVIEW_TAGS: REVIEW_TAGS,
    PLACES: PLACES,
    mapSize: { w: 1000, h: 640 }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = KTA.data;
})(typeof window !== 'undefined' ? window : globalThis);
