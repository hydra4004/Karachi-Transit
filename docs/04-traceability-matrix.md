# 04 — Traceability Matrix

## 1. The chain: problem → finding → requirement → principle → decision → feature

| User problem | Research finding | Design requirement | HCI principle | Design decision | Prototype feature (where to check) |
| --- | --- | --- | --- | --- | --- |
| Waits with no idea when the vehicle arrives | F1, F2 | FR2, FR3, IR2 | Visibility of system status | ETA card with Live or Estimated badge and update time | Home "Next arrivals" (`#homeNearby`), Map (`#mapSvg`), Stop sheet |
| Cannot plan a trip that needs two vehicles | F3 | FR4, IR6 | Reduce cognitive load | One step per card with board, ride and get-off stops | Plan tab → journey result (`#planResult`) |
| Does not trust an AI-made route | F9 | IR6 | Explainability, recognition over recall | Each step names the stop and why to change | Journey step cards, `reasonEn` / `reasonUr` in `sim.js` |
| Learns routes by asking strangers | F4 | FR1, IR1 | Recognition over recall, efficiency | One route list with search by number, stop or destination; Home keeps saved places and nearby arrivals | Routes → route detail |
| Feels unsafe, fears accidental or missed alerts | F5 | FR5, IR3 | Error prevention, user control | Hold-to-confirm SOS with cancel countdown | Safety screen (`#sosBtn`, `#sosCount`, `#btnCancelSos`) |
| Cannot judge a driver or vehicle before boarding | F5 | FR6, IR7 | Consistency, efficiency | Star rating plus quick tags, under 15 seconds | Review sheet (`#sheet [data-star]`, `[data-tag]`) |
| Chinchi stops have no formal names | F6 | FR9 | Match with the real world | Landmark name, illustration and Urdu label | Stop sheet (`.landmark-svg`), Stop detail |
| Prefers Urdu labels | F7 | FR10 | Accessibility and localization | Language toggle with right-to-left layout | More → Language, `#btnLangQuick`, every screen |
| No warning about breakdowns | F1 | FR7, FR8 | Visibility, feedback | Union status change becomes a route alert | Union portal Fleet + publish, commuter alert banner (`#homeAlerts`) |
| Cannot tell if a position is still current | F2 | IR5 | Help users recover from errors | Last known position with its age | Offline banner (`#offlineBanner`), "Last known" badge |
| Needs to use the phone in bright sun with one hand | Context of use | IR4 | Accessibility and localization | Large touch targets, keyboard/screen-reader controls, reduced-transparency support, high-contrast mode | `body.contrast`, `body.large-text`, settings switches, map controls |
| Cannot judge whether the SOS was really sent | F5 | FR5 | Feedback | "Report received" screen with stop and time | Safety screen after submit (`#safetyBody`) |

## 2. Requirement → implementation → verification

Every requirement is linked to the code that implements it and to the automated check that proves it works.

| Req | Implementation | Verified by |
| --- | --- | --- |
| FR1 | `KTA.data.ROUTES` (8 routes), `renderRoutes()`, `renderRouteDetail()` — every stop of the route is listed | `engine.test.js` "route data" + `ui.test.html` "all 8 routes are listed", "B13 shows all 6 stops" |
| FR2 | `KTA.sim.vehicles()` → `updateMapVehicles()` draws every vehicle on the SVG map, refreshed every second | `ui.test.html` "map draws the vehicles (14)" |
| FR3 | `KTA.sim.arrivalsForStop()` → `etaCardHtml()` on Home, Stop and Route screens | `engine.test.js` "arrivals are sorted by time" + `ui.test.html` ETA checks |
| FR4 | `KTA.sim.findPlan()` → prepared plans, or `buildPlan()` BFS with walk links | `engine.test.js` "planner" + `ui.test.html` "planner returns a multi-vehicle journey" |
| FR5 | `renderSafety()`, `submitReport()`; SOS hold → countdown → send; separate robbery report | `ui.test.html` "holding for 2 s starts the cancel countdown", "robbery report opens a separate form" |
| FR6 | `openReviewSheet()`, `KTA.sim.submitReview()`, review list on the route screen | `engine.test.js` "review stored and rating computed" + `ui.test.html` "rating sheet opens with 5 stars" |
| FR7 | Union portal Fleet view, `selectVehicle()`, `publish()`; driver-call log with acknowledge | `sync.test.html` "vehicle status panel opens", "acknowledging a call marks it as handled" |
| FR8 | `publishAlert()` → shared store → commuter alert banner and alerts screen | `sync.test.html` "commuter home shows the union alert banner" |
| FR9 | Landmark name, Urdu landmark name and inline illustration per stop | `ui.test.html` "stop sheet shows the landmark illustration" |
| FR10 | `KTA.i18n.setLang('ur')` sets `dir="rtl"`; every string exists in Urdu | `ui.test.html` "Urdu switches the layout to right-to-left" |
| IR1 | Home quick action → Routes → route detail | `ui.test.html` tab/click sequence (2 taps) |
| IR2 | `.badge.live` / `.badge.est` + "updated Ns ago" on every ETA | `ui.test.html` "no ETA claims to be live while offline" (badge logic) |
| IR3 | 2 s hold, 5 s countdown, Cancel always visible | `ui.test.html` "cancel is visible during the countdown" |
| IR4 | 48 px targets, bottom tab bar, `body.contrast`, `body.large-text` | `ui.test.html` "high-contrast mode can be switched on" |
| IR5 | `sim.isOffline()` freezes the clock; banner shows the age of the last update | `ui.test.html` "the banner states the age of the last update" |
| IR6 | Every step has stop names plus `reasonEn` / `reasonUr` | `engine.test.js` "every step explains itself (EN + UR)" |
| IR7 | 5 stars + one-tap tags + optional comment | `ui.test.html` "rating sheet opens with 5 stars" |

## 3. Traceability coverage summary

| Group | Count | Covered | Where |
| --- | --- | --- | --- |
| Functional requirements | 10 | 10 | Commuter app + union portal |
| Interaction requirements | 7 | 7 | Commuter app |
| Phase 1 findings | 9 | 9 | Each finding maps to at least one requirement above |
| HCI principles | 12 | 12 | Each is realised in a named screen |
| Scenarios | 4 (S1–S4) | 4 | S1 Home, S2 Plan, S3 Safety, S4 Union portal → commuter alert |
| Personas | 3 | 3 | Ayesha, Bilal, Mr. Qureshi |
| Evaluation tasks | 5 (T1–T4, U1) | 5 | All are runnable end to end in the prototype |

## 4. Requirement → Phase 1 finding coverage

| Finding | Requirements that answer it | Feature a tester will see |
| --- | --- | --- |
| F1 — no information while waiting | FR2, FR3, FR8, IR2 | Live map, ETA cards, union alert banner |
| F2 — cannot tell when a vehicle arrives | FR3, IR2, IR5 | Live/Estimated badge + update age |
| F3 — multi-vehicle trips are hard | FR4, IR1, IR6 | Journey planner with step cards |
| F4 — routes learned by asking people | FR1, IR1 | Routes list, search, saved places |
| F5 — safety concerns | FR5, FR6, IR3, IR7 | SOS hold + countdown, robbery report, review sheet |
| F6 — informal chinchi stops | FR9 | Landmark name + illustration in the stop sheet |
| F7 — Urdu preferred | FR10 | Language toggle, full RTL layout |
| F8 — live tracking and ETA most wanted | FR2, FR3 | Live map and ETA cards (and the union half that keeps them true) |
| F9 — trust needs visible reasoning | IR6 | Reason line on every journey step |

## 5. Where the prototype deliberately does not satisfy a requirement

| Requirement | Gap | Why | How to close it later |
| --- | --- | --- | --- |
| FR2, FR3 | Positions and ETAs are simulated, not from real trackers | No tracker hardware and no real feed was available in Phase 2 | Replace `shared/data.js` with an API client; the UI reads only through `KTA.sim` |
| FR4 | The planner is a graph search, not a model | "Real AI model behind the journey planner" is out of scope in the brief | Keep the explanation layer, replace the search with a model output of the same shape |
| FR7 | Driver assignment is a text field, not a driver database | Unions keep this in their own systems | Add a driver entity and a picker |
| IR5 | "Connection lost" is simulated by a switch and by the browser's own offline event | There is no real network dependency in a local prototype | Already wired to `window.addEventListener('offline')` for a real deployment |
