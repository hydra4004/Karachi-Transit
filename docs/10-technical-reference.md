# 10 — Technical Reference (how the prototype is built)

> A complete map of the project for anyone reading the code: what each feature does, which file implements it, which algorithm it uses, and what the technology choices were.
>
> **No third-party libraries are used.** See §12 for the full list and the reasoning.

---

## Table of contents

1. [Technology choices](#1-technology-choices)
2. [Architecture](#2-architecture)
3. [File-by-file reference](#3-file-by-file-reference)
4. [Feature → code map](#4-feature--code-map)
5. [How the hard parts work](#5-how-the-hard-parts-work)
6. [Algorithms in detail](#6-algorithms-in-detail)
7. [Data model](#7-data-model)
8. [Rendering and state flow](#8-rendering-and-state-flow)
9. [Styling and accessibility](#9-styling-and-accessibility)
10. [Testing](#10-testing)
11. [Performance and limits](#11-performance-and-limits)
12. [Libraries and standards used](#12-libraries-and-standards-used)
13. [What is not implemented](#13-what-is-not-implemented)

---

## 1. Technology choices

| Concern | Choice | Why |
| --- | --- | --- |
| Language | Vanilla JavaScript (ES5-compatible syntax, IIFE modules) | Runs in every browser with zero setup; a judge can open the folder and it works. No build step, no transpiler, no `npm install` |
| Markup | HTML5 | Semantic elements, `aria-*` attributes, inline `<svg>` for the map |
| Styling | CSS custom properties + a small class system | One design-token block in `shared/app.css` drives both apps |
| Modules | Classic `<script>` tags, each file an IIFE that attaches to a single global `KTA` | ES modules would be blocked by CORS on `file://`; classic scripts also work when the page is opened directly |
| State | `localStorage` + `BroadcastChannel` + `storage` event | Gives real cross-tab synchronisation between the two apps with no backend |
| Data | Simulated, hand-authored in one file | No real feed exists for Karachi routes; the data is separated so it can be swapped for an API later |
| Artwork | Inline SVG generated in JS | No image files, no network requests, no broken images offline |
| Icons | Inline SVG path set (`shared/assets.js`) | Same reason |
| Fonts | System font stack | No webfont download, no FOUT, works offline |
| Build / test tooling | None for the app; Node for the engine test; headless Chrome for the browser tests | Keeps "clone and open" true |

**Global namespace.** Every shared file does `var KTA = (root.KTA = root.KTA || {})` and adds one namespace: `KTA.data`, `KTA.geo`, `KTA.sim`, `KTA.store`, `KTA.i18n`, `KTA.assets`, `KTA.evalTool`. The two apps add nothing to the global scope — everything is inside their own IIFE.

---

## 2. Architecture

```
                        ┌──────────────────────────────┐
                        │        shared/data.js        │  static simulated dataset
                        │  stops · routes · vehicles   │  (replaced wholesale by a
                        │  plans · unions · calls      │   real API in production)
                        └──────────────┬───────────────┘
                                       │ read-only
                        ┌──────────────▼───────────────┐
                        │         shared/sim.js         │  the engine
                        │  KTA.geo  geometry            │
                        │  KTA.sim  vehicles, ETA,      │
                        │           planner, alerts     │
                        │  KTA.store  persistence +     │
                        │              cross-tab sync   │
                        └──────────────┬───────────────┘
                                       │
              ┌────────────────────────┴────────────────────────┐
              │                                                 │
   ┌──────────▼───────────┐                        ┌────────────▼───────────┐
   │   commuter/app.js    │                        │    union/portal.js     │
   │  5 tabs, 9 screens   │                        │  4 views, 1 flow      │
   │  map, planner, SOS   │                        │  fleet, status, calls │
   └──────────┬───────────┘                        └────────────┬───────────┘
              │                                                 │
              └────────────► localStorage "kta_ops_v1" ◄────────┘
                                    │
                      BroadcastChannel + storage event
                    (change in one tab → other tab re-renders)
```

**Data flow for a user action**, e.g. a union operator publishing a breakdown:

1. `union/portal.js` → `publish()` reads the draft state, calls `KTA.sim.setVehicleOps(vehicleId, patch)`.
2. `KTA.sim.setVehicleOps` writes `state.vehicles[vid]` through `KTA.store.update()`.
3. `KTA.store.write()` persists to `localStorage`, notifies local listeners, and posts on the `BroadcastChannel`.
4. The other tab receives it via `BroadcastChannel` **or** the `storage` event (the latter also fires across different browser windows).
5. `commuter/app.js`'s `KTA.store.onChange` handler re-renders the current screen and the alert banner.
6. Meanwhile `KTA.sim.publishAlert(alert)` adds a commuter-facing alert to `state.alerts`, and the commuter app renders it in `#homeAlerts` and in the Alerts screen.

---

## 3. File-by-file reference

### 3.1 `prototype/shared/data.js` — the simulated dataset (302 lines)

The single source of all static content. If the data is wrong, every screen is wrong; if the data is right, the UI cannot be.

| Export | Contents | Shape |
| --- | --- | --- |
| `KTA.data.STOPS` | 30 stops: 20 formal bus stops, 10 informal chinchi points | `{ id, name, ur, area, kind: 'formal'\|'informal', mode, x, y, landmark, landmarkUr, photo }` |
| `KTA.data.ROUTES` | 8 routes: 5 bus (B13, B21, B1, B5, B22), 3 chinchi (C1, C2, C3) | `{ id, number, name, ur, type, operator, track: 'live'\|'estimated', headwayMin, speedKmh, fare, path[[x,y]...], stopIds[] }` |
| `KTA.data.VEHICLES` | 14 vehicles, one driver each | `{ id, plate, model, routeId, driver{name,ur,phone,cnic}, phase, speed, capacity, occupancy, tripNo }` |
| `KTA.data.PLANS` | 6 prepared multi-leg journeys used by the planner for the evaluation pairs | `{ id, from, to, title, totalMin, walkMin, cost, steps[] }` |
| `KTA.data.UNIONS` | 3 unions with their routes and operator contact | `{ id, name, ur, routes[], operator, operatorUr, phone }` |
| `KTA.data.CALLS` | 3 seeded driver phone calls (one breakdown, two delays) | `{ id, vehicleId, name, phone, message, severity, at }` |
| `KTA.data.REVIEWS` | 5 seeded ratings so averages are not zero | `{ id, targetType, targetId, stars, tags[], comment, at, author }` |
| `KTA.data.REVIEW_TAGS` | 11 quick tags, each with an English and an Urdu label | `{ id, en, ur }` — e.g. `{ id: 'on_time', en: 'On time', ur: 'وقت پر' }` |
| `KTA.data.PLACES` | 3 saved-place shortcuts (Home, Work, University) | `{ id, en, ur, stopId }` |

**The map is a 1000x640 schematic**, hand-drawn in route `path` arrays with decorative local street, coastline, and neighborhood layers. `x`/`y` are pixel coordinates in that space; `st_ghanta` at `[533, 318]` is the same point on the map whether it is drawn as a stop, used by the ETA model, or hit-tested by a click.

A stop's `photo` field names the illustration in `assets.js` (`'clock'`, `'mosque'`, `'pump'`, ...) and its `landmark` / `landmarkUr` fields carry the informal name people actually use.

A route's `track` field decides whether its ETAs are shown as **Live** or **Estimated**: four routes are `live`, four are `estimated`. `headwayMin` (e.g. 12 for B13) is the scheduled gap between two vehicles on that route. Speeds range from 16 to 25 km/h and fares from Rs 20 to Rs 45.

### 3.2 `prototype/shared/sim.js` — the engine (553 lines)

Four namespaces in one file:

**`KTA.geo` — polyline geometry**

| Function | What it does |
| --- | --- |
| `pathCum(path)` | Cumulative arc-length table, so distance along a path is a lookup instead of a re-walk |
| `pathLength(cum)` | Total length of the polyline |
| `pointAt(path, cum, t)` | Point at normalised position `t` in [0,1) — used to place a moving vehicle |
| `project(path, cum, x, y)` | Nearest point on the polyline to `(x, y)` -> `{ t, dist }` — used to snap each stop onto its route line and to measure how far a stop is from the line |
| `forwardDelta(t1, t2)` | Forward distance from `t1` to `t2`, wrapping at 1.0 — the core of "how far until the bus reaches this stop" |

**`KTA.sim` — the simulation**

| Function | What it does |
| --- | --- |
| `simMinutes()` | Simulated minutes since a fixed epoch, scaled by the demo clock factor. **Frozen while offline** so positions hold still |
| `vehicleState(v)` | The full live state of one vehicle: position, heading, status, delay, driver, occupancy, liveness, data age |
| `etaMinutes(vehicle, stopId)` | The ETA model (see section 6.2) |
| `arrivalsForStop(stopId)` | Every arrival at a stop, sorted by time, excluding out-of-service vehicles |
| `nextArrival(routeId, stopId)` | The soonest arrival of one route at one stop |
| `routesServingStop(stopId)` | Which routes call at a stop |
| `routeProgress(routeId)` | For each vehicle on a route: the next stop it will reach and the ETA to it |
| `findPlan(from, to)` | The planner: prepared plan if one exists, otherwise `buildPlan()` |
| `buildPlan(from, to)` | Breadth-first search over the stop graph (see section 6.3) |
| `submitReview`, `reviewsFor`, `ratingFor` | Reviews and their running average |
| `submitReport` | SOS and robbery reports |
| `publishAlert`, `activeAlerts`, `alerts` | Union-published alerts |
| `setVehicleOps`, `opsFor` | The union's per-vehicle overrides (status, delay, driver, note) |
| `calls`, `acknowledgeCall` | The driver-call log |
| `search(query)` | Case-insensitive substring match across stops (name, Urdu name, area, landmark), routes (number, name, Urdu name) and saved places |

**`KTA.store` — persistence and cross-tab sync**

```
read()        -> parse localStorage["kta_ops_v1"], merge with defaults
write(state)  -> persist + notify in-page listeners + BroadcastChannel post
update(fn)    -> read, mutate, write
onChange(fn)  -> subscribe (in-page)
reset()       -> clear the key and notify
```

**`KTA.geo` scale constants**: `KM_PER_PX = 0.028` (schematic map scale) and `DWELL_SEC = 25` (average stop dwell).

### 3.3 `prototype/shared/i18n.js` — English/Urdu and RTL (266 lines, 193 keys)

- A flat table of keys, each `[english, urdu]`: `'eta.live': ['Live', 'لائیو']`.
- `t(key, vars)` looks up the current language and interpolates `{n}`-style placeholders.
- `setLang(lang)` stores the choice in the shared store and sets `document.documentElement.dir = 'rtl' | 'ltr'` plus `lang`.
- `apply()` walks the DOM and replaces the text of every element carrying a `data-i18n` attribute — so HTML stays in one language and JS renders in the other.
- Urdu strings are written in Urdu, not machine-translated English.

### 3.4 `prototype/shared/assets.js` — artwork (146 lines)

- `KTA.assets.landmarks[id]` — an inline SVG illustration per landmark (clock tower, mosque gate, petrol pump, bakery...). Chosen because a chinchi stop *is* a landmark (FR9) and a picture is what a commuter recognises.
- `KTA.assets.icons[name]` — a 24x24 stroke icon set (bus, rickshaw, sos, alert, pin, star, map, plan, flag, phone, back, swap, close, refresh).
- `KTA.assets.starsHTML(rating, count)` — renders a star row from a numeric average.

### 3.5 `prototype/shared/eval.js` — evaluation instrumentation (141 lines)

- `KTA.evalTool.enable(participant)` — starts a session, assigns a participant id and session id.
- `.log(type, meta)` — appends `{ t, type, task, screen, meta }`. Types: `tap`, `screen_change`, `search`, `plan`, `review`, `sos_*`, `error`, `note`, `task_start`, `task_end`.
- `.startTask(id)` / `.endTask(id)` — bracket each task so duration is measurable.
- `.summary()` — per task: duration, tap count, error count, completed.
- `.toJSON()` / `.toCSV()` / `.download(format)` — export for analysis.
- The panel that drives all of this is rendered by `commuter/app.js` (`renderEvalPanel()`) and is hidden until switched on, so a participant does not watch it.

### 3.6 `prototype/shared/app.css` — the design system (425 lines)

CSS custom properties for colour, radius, shadow and type scale; then shared components: `.card`, `.chip`, `.badge`, `.btn`, `.banner`, `.sheet`, `.phone`, `.tabbar`, `.routechip`, `.eta-card`, `.switch`, `.star`, plus the `body.light-mode`, `body.large-text` and `body.contrast` modifier blocks and the RTL rules.

### 3.7 `prototype/commuter/index.html` — the app shell (210 lines)

Static structure only: an app bar, nine `.screen` sections (`home`, `map`, `routes`, `route`, `stop`, `plan`, `safety`, `more`, `alerts`), a bottom tab bar with five tabs, a bottom-sheet container (`#scrim` + `#sheet`), a toast, and the evaluation panel. Every screen is present in the HTML and shown or hidden by toggling `.active` — there is no client-side templating framework and no screen is created from a string.

### 3.8 `prototype/commuter/app.js` — the commuter app (1192 lines)

Organised as a single IIFE with a `state` object and a render function per screen.

| Group | Functions |
| --- | --- |
| Navigation | `go(screen, opts)`, `back()`, `updateTabs()`, `renderScreen()`, `renderCurrent()` |
| Home | `renderHome`, `renderHomeAlerts`, `renderOfflineBanner`, `renderHomePlaces`, `renderHomeRecent`, `renderHomeNearby`, `renderHomeRoutes`, `renderSearchResults` |
| Map | `renderMap`, `buildMapSvg`, `updateMapVehicles`, `renderMapBanner`, `renderMapChips`, `applyView`, `bindMapEvents`, `zoomBy` |
| Sheets | `openSheet`, `closeSheet`, `openStopSheet`, `openVehicleSheet`, `openReviewSheet`, `openRobberySheet`, `paintStars` |
| Routes | `renderRoutes`, `openRoute`, `renderRouteDetail`, `renderReviewsBlock`, `openStop`, `renderStopDetail` |
| Planner | `renderPlan`, `resolveStop`, `renderPlanResult` |
| Safety | `renderSafety`, `bindSosButton`, `startCountdown`, `cancelSos`, `renderReportsList` |
| Settings | `renderMore`, `switchLang`, `toggleSetting` |
| Evaluation | `renderEvalPanel` |
| Live loop | `refreshDynamic` — called every second, re-renders only the dynamic parts and restores scroll position |

### 3.9 `prototype/union/index.html` + `portal.js` + `portal.css` — the union portal

A sidebar shell with four views (`#viewFleet`, `#viewCalls`, `#viewAlerts`, `#viewSettings`) and a split layout: the fleet table on the left, the vehicle status panel on the right, and a live iframe preview of the commuter app below it.

| Function | What it does |
| --- | --- |
| `renderFleet()` | The vehicle table (plate, route, driver, status) with filter chips: All / Bus / Chinchi / Delayed / Out of service |
| `selectVehicle(vid)` | Loads that vehicle's current ops state into an editable `draft` |
| `renderVehiclePanel()` | Status radio group, delay minutes, driver reassignment dropdown, note box, **Publish** button, and the "Commuters will see" preview |
| `buildMessage(v, draft)` | Composes the alert sentence in English and Urdu. The preview and the published alert use this *same function*, so what the operator reads is exactly what the commuter gets |
| `publish()` | Writes the vehicle ops, builds the alert, publishes it, re-renders |
| `renderCalls()` | The driver-call log with **Acknowledge** and **Log call**; "Log call" pre-fills the vehicle panel with the call's severity and message |
| `renderAlerts()` | Published alert history |
| `renderPreviewList()` | The commuter-facing list shown in the preview panel |

### 3.10 `prototype/index.html` — the launcher

The landing page: a card per product, the six-step demo script, the local-serving instructions, and pointers to the docs and the test suites.

---

## 4. Feature to code map

| # | Feature | Where it is implemented | Key mechanism |
| --- | --- | --- | --- |
| 1 | Route browsing with every stop | `commuter/app.js` -> `renderRoutes()`, `renderRouteDetail()` | `KTA.data.ROUTES` + `route.stopIds` |
| 2 | Live vehicle tracking on a map | `commuter/app.js` -> `buildMapSvg()`, `updateMapVehicles()` | `KTA.geo.pointAt()` along each route path, redrawn every second |
| 3 | ETA per stop with Live/Estimated + age | `commuter/app.js` -> `etaCardHtml()`; `sim.js` -> `etaMinutes()` | See section 6.2 |
| 4 | Multi-vehicle journey planner | `sim.js` -> `findPlan()` / `buildPlan()`; `commuter/app.js` -> `renderPlanResult()` | BFS over route + walk edges, ranked (section 6.3) |
| 5 | Step-by-step explanation (explainability) | `sim.js` -> `planFromLegs()` | Every step carries `reasonEn` + `reasonUr` |
| 6 | SOS with hold + cancel countdown | `commuter/app.js` -> `bindSosButton()`, `startCountdown()`, `cancelSos()` | Timer-driven hold (section 5.3) |
| 7 | Robbery report (separate from SOS) | `commuter/app.js` -> `openRobberySheet()`; `union/portal.js` -> `renderReports()` | Optional bus association; admin report list shows route number and plate |
| 8 | Driver / vehicle reviews | `commuter/app.js` -> `openReviewSheet()`; `sim.js` -> `submitReview()` | 5 stars + tags + optional comment; running average |
| 9 | Landmark names and illustrations | `shared/assets.js`; `commuter/app.js` -> `openStopSheet()` | Inline SVG per landmark id |
| 10 | Urdu / English with RTL | `shared/i18n.js`; `shared/app.css` | `dir` attribute + CSS logical properties |
| 11 | Union vehicle status management | `union/portal.js` -> `selectVehicle()`, `renderVehiclePanel()`, `publish()` | Store patch + broadcast |
| 12 | Union alerts reaching commuters | `union/portal.js` -> `publish()`; `sim.js` -> `publishAlert()` | Same store, `BroadcastChannel` |
| 13 | Driver-call log | `union/portal.js` -> `renderCalls()`; `sim.js` -> `acknowledgeCall()` | Call state stored per call id |
| 14 | Offline: last known position + age | `sim.js` -> `isOffline()`, `offlineAgeSec()`; `commuter/app.js` -> `renderOfflineBanner()`, `etaCardHtml()` | Clock freeze (section 5.4) |
| 15 | Light mode and accessibility (contrast, large text, touch size) | `shared/app.css`; `commuter/app.js` -> `toggleSetting()` | Persisted theme setting and CSS modifier classes |
| 16 | Evaluation logging and export | `shared/eval.js`; `commuter/app.js` -> `renderEvalPanel()` | Event log in `localStorage["kta_eval_v1"]` |
| 17 | Search by stop / route / area / landmark | `sim.js` -> `search()` | Case-insensitive substring match over several fields |
| 18 | Map pan and zoom | `commuter/app.js` -> `bindMapEvents()`, `applyView()`, `zoomBy()` | Pointer capture drag + `viewBox` manipulation |
| 19 | Demo clock (1x / 4x / 12x) | `sim.js` -> `clockFactor()` | Scales simulated minutes |
| Out-of-service vehicle position | `sim.js` -> `setVehicleOps()`, `vehicleState()` | Saves position at the status change; migrates older records so map refreshes and clock-speed changes do not move the marker |
| Admin SOS and complaint inbox | `union/portal.js` -> `renderReports()` | Reads commuter reports from the shared store; complaints can carry a route number and bus plate |
| 20 | Reset demo data | `sim.js` -> `Store.reset()` | Clears the store key |

---

## 5. How the hard parts work

### 5.1 Live tracking (no real GPS)

There is no GPS and no server. A vehicle's position is **derived from a deterministic function of the clock**, which is what makes the two browser tabs agree without exchanging any position data.

```
phase        a per-vehicle constant in [0,1): where it starts on the route
simMinutes() simulated minutes since the epoch x demo-clock factor
t            = (phase + simMinutes() x speed) mod 1     <- position along the route
point        = KTA.geo.pointAt(route.path, route._cum, t)
heading      = atan2 of the vector to the point a little further along the path
```

Because `t` is a pure function of wall-clock time, the commuter app and the union portal compute the *same* position for the same vehicle at the same moment, with no data exchanged. The map redraws the vehicle layer once per second (`refreshDynamic` -> `updateMapVehicles`), so the buses visibly move and the ETA numbers count down.

The polyline is a list of pixel coordinates, so a vehicle follows the shape of the road rather than a straight line between stops. The heading is computed from the direction to the next point on the path, so the little bus icon rotates as it rounds a corner.

### 5.2 The ETA model

`etaMinutes(vehicle, stopId)` in `sim.js`:

1. `t_veh` — the vehicle's current position along the route (section 5.1).
2. `t_stop` — the stop's position along the route, computed **once at load time** by `KTA.geo.project()` (the nearest point on the polyline to the stop's coordinates).
3. `d = forwardDelta(t_veh, t_stop)` — the forward distance, wrapping at the end of the loop, so a bus near the end of its route correctly reports a large distance to a stop it has not reached yet.
4. `km = d x route._lenKm`, where `route._lenKm = polyline length x KM_PER_PX`.
5. `minutes = (km / speedKmh) x 60` — travel time at the route's average speed (16-25 km/h across the eight routes).
6. **Dwell time**: every stop strictly between the vehicle and the target adds `DWELL_SEC` (25 s).
7. **Congestion**: multiplied by `1 + |jitter(floor(simMinutes()) + route.number.length)| x 0.12`, where `jitter` is a deterministic hash-based pseudo-random function in [-1, 1]. Deterministic so the number does not flicker between two tabs, but varied per minute and per route.
8. **Status adjustments**: a delayed vehicle adds `delayMin`; a vehicle on a route without live tracking (`track: 'estimated'`) adds up to 2.5 minutes of uncertainty.
9. The result is clamped to at least 0.

`arrivalsForStop(stopId)` runs that for every vehicle serving the stop, drops out-of-service vehicles, and sorts by minutes. Each arrival carries `live` (the route has live tracking and the tracker is fresh), `stale` (this particular tracker is old), `liveAgeSec` (how many seconds since the last update) and `estimatedAgeMin`. The UI turns those into the **Live / Estimated / Last known** badge and the "updated Ns ago" line — this is IR2, and it is also why the offline mode can honestly downgrade a badge.

### 5.3 The SOS flow (hold, then countdown, then send)

```
idle --hold 2 s--> countdown(5 s) --> report sent --> "Report received"
  ^                    |
  +--- release / cancel+
```

- `pointerdown` on the SOS button starts a **30 ms interval** and records `startTs = Date.now()`.
- Each tick computes `p = (now - startTs) / 2000` and updates the progress ring with `stroke-dashoffset = 603 x (1 - p)`.
- At `p >= 1` the interval is cleared and `startCountdown()` runs: a 5-second countdown, a permanently visible **Cancel** button, and an `aria-live` announcement.
- `pointerup` **anywhere in the window** cancels a hold that has not reached 2 s, so a pocket touch or a slipped finger never sends an alert.
- The robbery report is a **separate button** that opens a different sheet, so reporting a robbery cannot send an SOS by accident.

> The hold was originally `requestAnimationFrame`-based. That was correct on a real device but the ring never started in headless Chrome, and the same class of bug would appear on a backgrounded tab — so it is timer-driven now.

### 5.4 Offline behaviour (IR5)

When the connection drops, the app must not lie about how fresh the data is.

- `simMinutes()` clamps "now" to `settings.offlineSince`, so **every vehicle keeps its last known coordinates** and every ETA keeps its last value.
- `vehicleState()` reports `live: false` and an `liveAgeSec` equal to the seconds since the connection was lost.
- The banner says "Connection lost" and "last update N min ago".
- Every ETA badge changes from **Live** to **Last known**, and the ETA is not re-forecast.
- Reconnection (or switching the toggle off) restores live behaviour immediately.
- The app also listens to the browser's own `online`/`offline` events, so a real disconnection is handled the same way.

### 5.5 The union to commuter loop

`publish()` in `union/portal.js` is the only place where a union change is made, and it does four things in order:

1. `KTA.sim.setVehicleOps(vehicleId, { status, delayMin, note, driver })` — the vehicle's operational state.
2. `buildMessage(v, draft)` — the alert sentence, in English and Urdu.
3. `KTA.sim.publishAlert(alert)` — a commuter-facing record with severity, route and vehicle.
4. `KTA.store.write()` (inside the two calls above) — persistence plus broadcast.

On the commuter side, `KTA.store.onChange()` triggers `renderCurrent()` and `renderEvalPanel()`, so the alert banner appears and the Alerts screen lists it. Because `arrivalsForStop()` skips vehicles whose status is `out_of_service`, the broken bus also disappears from the arrival lists — the alert is not just a message, it changes the data the commuter acts on.

The portal's preview panel uses `buildMessage()` as well, so the operator reads the exact sentence that will be published.

### 5.6 The map

- The map is a single inline `<svg viewBox="0 0 1000 640">` containing: a background, the sea, 11 area labels, one `<polyline>` per route (`stroke-width` 5 for buses, 3.5 for chinchis, so the two networks are told apart by weight as well as colour), one shape per stop (circle = formal, rounded square = informal), and a `<g id="vehLayer">` for the vehicles.
- **Pan**: `pointerdown` captures the pointer, `pointermove` converts screen pixels to SVG units using the element's bounding rect, and updates `state.view`; `applyView()` writes the new `viewBox`.
- **Zoom**: the mouse wheel and the `+` / `-` / `fit` buttons call `zoomBy(factor)`, which scales the view box around its centre and clamps the width to 200-1400.
- **Hit testing**: a single delegated `click` handler checks `closest('[data-stop]')`, then `closest('[data-veh]')`, then `closest('[data-route-line]')` — so one handler serves 30 stops, 14 vehicles and 8 lines. The vehicle layer has `pointer-events: none` so it cannot swallow clicks meant for a stop underneath it.

### 5.7 The journey planner

Two paths to the same result shape.

**Prepared plans** — six journeys in `data.js` with hand-written steps, used for the pairs the evaluation uses, so the wording is deliberately good.

**Fallback search** — `buildPlan(from, to)` for any other pair:

1. **Build the graph.** For every route, every ordered pair of its stops becomes a *route edge* (you can ride one vehicle between them). For every stop, every stop within `WALK_LIMIT_PX = 46` pixels becomes a *walk edge* — this is what connects a chinchi point to a nearby bus stop (e.g. Merewether Clock Tower and KPT Head Office).
2. **Search.** Breadth-first search, maximum depth 4 legs, frontier capped at 600 nodes.
3. **Rank** the solutions: fewer chinchi legs first (a bus trip is more predictable), then fewer vehicles, then shorter total time.
4. **Render the steps** in `planFromLegs()`: a *board* card per route leg, a *transfer* card (7 minutes) **only between two route legs**, a *walk* card for walk legs and for the final walk to the destination. Every card carries the stop names and a one-line reason in both languages.

The search is intentionally simple: it is a transparent graph walk, not a model, because the brief puts a real model out of scope — and because Phase 1 finding F9 says the trust comes from *seeing the reasoning*, which a search can show and a model usually cannot.

### 5.8 Rendering strategy

No virtual DOM, no framework. Each screen has a render function that rebuilds its HTML and assigns it with `innerHTML`; delegated event listeners on stable containers (`#tabbar`, `#routeBody`, `#mapSvg`) handle the clicks. The one-second refresh calls only the *dynamic* renderers and restores `scrollTop` afterwards, so a list does not jump under the reader's finger.

The safety reason: every screen is small, the data is small, and a prototype that a judge can read in one sitting is worth more than one that is engineered for scale.

---

## 6. Algorithms in detail

### 6.1 Geometry

| Algorithm | Complexity | Where |
| --- | --- | --- |
| Cumulative arc length | O(n) once per route at load | `pathCum` |
| Point at parameter t | O(n) linear scan over the cumulative table | `pointAt` — called once per vehicle per second (14 x 1/s, trivial) |
| Nearest point on polyline (projection) | O(n) per segment | `project` — called once per stop per route **at load time** to compute `route._stopT` |
| Forward wrap-around distance | O(1) | `forwardDelta` |

Projection is the one that matters: because a stop is stored as a free `x/y` and the route as a polyline, the engine must know *where along the route* each stop sits. `project()` finds the closest point on every segment, takes the minimum distance, and returns the normalised position `t = (cumulative length before the segment + t x segment length) / total length`. That value is cached in `route._stopT[stopId]`.

### 6.2 ETA

```
d        = forwardDelta(vehicle.t, route._stopT[stopId])   in [0,1)
km       = d x route._lenKm
minutes  = (km / speedKmh) x 60
minutes += 25 s x (number of stops strictly between)
minutes *= 1 + |jitter(minute + routeSeed)| x 0.12
minutes += delayMin            (if the union marked it delayed)
minutes += up to 2.5 min       (if the route has no live tracking)
```

### 6.3 Planner (BFS + ranking)

| Step | Detail |
| --- | --- |
| Graph | Nodes = stops. Edges = route legs (any ordered pair of stops on a route) and walk legs (stops within 46 px) |
| Search | BFS, depth at most 4 legs, at most 600 nodes per level |
| Ranking | `chinchiLegs` ascending, then `vehicleCount` ascending, then `totalMinutes` ascending |
| Rendering | `planFromLegs()`: board cards, transfer cards between route legs, walk cards, plus a 4-minute final walk; each with `reasonEn` / `reasonUr` |

Walk minutes are `max(2, round(distancePx / 14))` — roughly 4 km/h.

### 6.4 Deterministic pseudo-randomness

`jitter(seed) = (fract(sin(seed x 12.9898) x 43758.5453) x 2) - 1`

A hash-based value in [-1, 1]. It is used for congestion noise and estimated-ETA uncertainty. It is *not* `Math.random()` on purpose: two browser tabs must compute the same ETA for the same vehicle, otherwise the union preview and the commuter screen would disagree.

### 6.5 Search ranking

Substring matching across stop name, Urdu name, area, landmark, route number, route name and saved place. Results are grouped into *routes*, *stops* and *places*, and the UI shows each group under its own heading.

### 6.6 Rating aggregation

`ratingFor(targetId)` averages the stars of all reviews for that target, and the review list shows the newest first. The seeded reviews mean the average is never 0, so the star display is meaningful in a demo.

---

## 7. Data model

```jsonc
// localStorage["kta_ops_v1"]
{
  "vehicles": {
    "v_b13_1": { "status": "running|delayed|out_of_service",
                 "delayMin": 0, "driver": { "name": "...", "plate": "..." },
                 "note": "", "updatedAt": 0, "updatedBy": "" }
  },
  "alerts": [
    { "id": "...", "routeId": "r_b13", "routeNumber": "B13", "routeName": "...",
      "routeNameUr": "...", "vehicleId": "v_b13_1", "plate": "KHI-8871",
      "severity": "delayed|out_of_service|driver_changed|info",
      "message": "...", "messageUr": "...", "why": "", "delayMin": 0, "at": 0 }
  ],
  "reports": [
    { "id": "...", "type": "sos|robbery", "vehicleId": "v_b13_1",
      "stopId": "st_pechs", "note": "...", "at": 0, "status": "sent" }
  ],
  "reviews": [
    { "id": "...", "targetType": "route|vehicle|driver", "targetId": "r_b13",
      "stars": 4, "tags": ["on_time"], "comment": "...", "author": "P12", "at": 0 }
  ],
  "calls": { "call_1": { "acknowledged": true, "at": 0 } },
  "settings": { "lang": "en", "clockFactor": 4, "largeText": false,
                "contrast": false, "offline": false, "offlineSince": null }
}
```

Static data (`STOPS`, `ROUTES`, `VEHICLES`, `PLANS`, `UNIONS`, `CALLS`, `REVIEWS`, `REVIEW_TAGS`, `PLACES`) lives in `shared/data.js` and is **read-only** at runtime. The store holds only what a user or an operator changes. That separation is the migration path to a real backend: replace `data.js`, keep the store as the write-through cache.

---

## 8. Rendering and state flow

```
                        ┌────────────────────────────┐
   user taps / store ──>│ app.js event handler       │
   changes              │  (delegated on containers)  │
                        └──────────────┬─────────────┘
                                       │ mutates state / calls KTA.sim
                                       v
                        ┌────────────────────────────┐
                        │ render<Screen>()           │
                        │  -> innerHTML = "..."      │
                        │  -> restore scrollTop      │
                        └────────────────────────────┘
```

- `state` holds only UI state: `screen`, `view` (map camera), `mapFilter`, `mapFocusRoute`, `lastQuery`, `sos` (phase, startTs, countdown), `offline`, `lang`.
- Domain state lives in the store and in the static dataset.
- `refreshDynamic()` runs every second and re-renders only the volatile parts (arrival cards, vehicle positions, the map layer, alert banners), then restores the scroll position of the active screen.

---

## 9. Styling and accessibility

| Concern | Implementation |
| --- | --- |
| Design tokens | CSS custom properties in `shared/app.css` (`--ink`, `--bg`, `--brand`, `--danger`, `--radius`, `--shadow`, type scale) |
| Theme | `body.light-mode` switches the full commuter app and map to a persisted light palette; dark remains the default |
| RTL | `dir="rtl"` on the root element; the layout uses **logical properties** (`margin-inline-start`, `padding-inline`, `border-inline-end`) so it mirrors automatically instead of needing a mirrored stylesheet |
| Contrast mode | `body.contrast` raises border weights, darkens secondary text and removes low-contrast greys — for sunlight |
| Large text | `body.large-text` scales the type scale and row heights without breaking layout |
| Touch targets | Interactive rows are at least 48 px; the SOS button is about 96 px |
| Screen readers | `role="status"` on live banners, `aria-label` on icon-only buttons, `aria-live` on the SOS countdown, visible focus rings, `lang` and `dir` set on the root |
| Not colour alone | Route type is shown as a chip with the route number and an icon; Live/Estimated badges carry words |

---

## 10. Testing

| Suite | Type | Checks | Scope |
| --- | --- | --- | --- |
| `tests/engine.test.js` | Node | 221 | Data integrity, stop-to-route projection, ETA model, sorted arrivals, planner (prepared + fallback), store round trip, search, reviews |
| `tests/ui.test.html` | Headless Chrome | 88 | The real commuter app: navigation, route/stop content, map, responsive home/planner layout, SOS hold and cancel, robbery report, Urdu RTL, contrast, offline, review sheet |
| `tests/sync.test.html` | Headless Chrome | 25 | Union portal to commuter app: status updates and frozen map marker, legacy-position migration, report inbox, bus identification on complaints |
| `tests/run-tests.ps1` | PowerShell | — | Starts a local server, runs all three, stops the server, prints a summary |

**How the browser tests work**: a test page loads the app in an `<iframe>`, then drives it with real DOM events (`MouseEvent`, `PointerEvent`) and asserts on the resulting DOM. The union portal and the commuter app are two iframes on the same origin, so `localStorage` and the `storage` event connect them exactly as they would in two real tabs.

---

## 11. Performance and limits

| Property | Value |
| --- | --- |
| Bundle size | about 185 KB of hand-written HTML/CSS/JS in total, no images, no fonts, no network |
| Frame budget | One full map redraw per second: 14 vehicles + 30 stops + 8 polylines — trivial for the DOM |
| Geometry cost | `pointAt` is O(points per route) per vehicle per frame; route-to-stop projection is done once at load |
| Storage | One `localStorage` key for domain state, one for the evaluation log |
| Engine test scale | 70 vehicle/stop ETA pairs, plus stop-to-route projection for every stop on every route |
| Scaling limit | Stop lookup (`stopById`) and route lookup are linear scans; at thousands of stops a spatial hash would be needed. The ETA model is O(vehicles x stops) per screen refresh, which is why a real deployment would compute ETAs server-side |
| Browser support | Any modern browser; `BroadcastChannel` is feature-detected and the `storage` event is the fallback |

---

## 12. Libraries and standards used

| Category | What is used |
| --- | --- |
| Language / runtime | Vanilla JavaScript, HTML5, CSS3 — **no third-party libraries, no frameworks, no build step** |
| Native browser APIs used | `localStorage`, `BroadcastChannel`, `Blob` + `URL.createObjectURL` (CSV/JSON download), `PointerEvent` + `setPointerCapture` (map pan), `wheel`, `navigator.onLine` + `online`/`offline` events, `Intl` / `toLocaleTimeString`, `Date.now`, `JSON` |
| Standards | SVG 1.1 for the map and the illustrations, ARIA (`role`, `aria-label`, `aria-live`), CSS custom properties, CSS logical properties, `localStorage` and `StorageEvent`, `BroadcastChannel` (W3C), HTML5 `input[type=number]`, the `download` attribute |
| Server | Python 3 `http.server` for local hosting only (any static server works) |
| Test tooling | Plain Node assertions (no test framework), headless Chrome `--dump-dom` for the browser suites, PowerShell for the runner |
| Deliberately absent | React/Vue/Svelte, jQuery, D3, Leaflet, Mapbox, a charting library, a CSS framework, a bundler, a package manager, a backend, a database, a test framework, an icon font |

**Why no libraries.** This is a prototype that a marker must be able to run. A `package.json`, a build step and a `node_modules` folder are three ways for the demo to break on an unfamiliar machine. Everything here is either a browser standard or a file in the repository.

**Why no mapping library.** A tile server needs a network connection and an API key, and the Karachi basemap would introduce a third-party dependency into a "no network" prototype. A hand-drawn schematic of Karachi's real geography (Sea View, Clifton, PECHS, Bahadurabad, University, Gulshan, plus the northern corridor) does the job for a transit map, and it is what the design research actually calls for.

---

## 13. What is not implemented

Honest inventory, so nobody is surprised:

| Missing | Status | Notes |
| --- | --- | --- |
| **A custom route builder** (a union operator drawing a new route, adding stops, editing the polyline) | **Not implemented** | The union portal manages *vehicles* (status, delay, driver, note) and *alerts*, but not route geometry. Routes live in `data.js` as `path` + `stopIds` and are edited by hand. The pieces for it exist: `KTA.geo.project()` would snap drawn points to the road network, `buildMapSvg()` already renders a route polyline, and the store already persists custom data — the missing part is a drawing UI and a route editor in the portal |
| Route creation / editing in the portal | Not implemented | Same as above |
| Driver-facing app | Out of scope in the brief | Drivers phone the union; the portal logs the call |
| Payments, ticketing, accounts | Out of scope in the brief | — |
| Real GPS / real ETA feed | Not available | Simulated positions; `data.js` is the seam to swap |
| Real AI planner | Out of scope in the brief | Transparent graph search with written reasons instead |
| Push notifications | Not implemented | Alerts are polled every second from the shared store |
| A real backend | Not implemented | `localStorage` + `BroadcastChannel` stands in for a server |
| Map tiles / real geography | Not implemented | Schematic SVG |
| Dark mode | Not implemented | Deliberate: the light theme is tuned for outdoor readability |
| Form validation on the review comment | Not implemented | The comment is optional and free text by design (IR7) |
