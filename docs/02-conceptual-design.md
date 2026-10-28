# 02 — Conceptual Design

## 1. Product model

```
            ┌──────────────────────────┐         ┌───────────────────────────┐
            │      COMMUTER APP        │         │       UNION PORTAL        │
            │      (mobile, 5 tabs)     │         │      (desktop, 4 views)    │
            └────────────┬─────────────┘         └────────────┬──────────────┘
                         │  reads                          │  writes
                         │  vehicle state,                 │  vehicle status,
                         │  alerts, reviews                │  driver calls,
                         ▼                                ▼  published alerts
            ┌────────────────────────────────────────────────────────────────┐
            │   shared store (localStorage "kta_ops_v1") + BroadcastChannel │
            │   vehicle ops · alerts · reports · reviews · call log         │
            └────────────────────────────────────────────────────────────────┘
```

One shared store keeps the two prototypes consistent: what the union publishes is what the commuter sees, in the same second, on the same machine.

## 2. Information architecture

### Commuter app — five bottom tabs

| Tab | Purpose | Screens | Requirements |
| --- | --- | --- | --- |
| **Home** | Orient the user: current alerts, a broad search, the next nearby arrivals, and saved-place shortcuts | Home, Alerts, Route detail, Stop detail, Safety | FR1, FR2, FR3, FR5, FR8 |
| **Map** | Where is everything right now | Map (simulated vehicles, route lines, stop points, pan/zoom, filter chips, area context) | FR2, FR3, FR9 |
| **Routes** | The full network as a browsable list | Routes list (bus/chinchi filter, search), Route detail (stop list, vehicles, reviews) | FR1, FR6, IR1 |
| **Plan** | Get me there, possibly with two vehicles | Planner input, Journey result (step cards), Transfer step | FR4, IR6 |
| **More** | Settings, language, accessibility, saved places, demo controls | More (language, accessibility, places, clock, connection, evaluation mode, reset) | FR10, IR4, IR5, NFR2 |

Detail screens (route, stop, alerts, safety) are pushed on top of the current tab and keep the tab bar visible, so the user is never lost.

### Union portal — four sections

| Section | Purpose | Requirements |
| --- | --- | --- |
| **Fleet** | Every vehicle with its live status, plate, driver, route; select a vehicle to change its status | FR7 |
| **Driver calls** | The log of what drivers reported by phone, with acknowledge / log call actions | FR7 |
| **Alerts** | History of published commuter-facing alerts | FR8 |
| **Settings** | Union profile, demo clock, reset | NFR1 |

A live preview of the commuter app sits on the right of the Fleet screen (`#pvFrame`) so the operator can see the effect of the change they are making.

## 3. Task model

### T1 — Find the bus that goes from a given stop to a given destination
`Home` → tap **Routes** (or type in search) → tap the route → **read the stop list** → goal: the correct route is open.
Satisfies FR1, IR1. Success: opens the correct route in ≤ 3 taps.

### T2 — Track that bus and say when it reaches a given stop
`Home` → tap the ETA card for the vehicle → **Map** with that vehicle focused → tap the target stop → **read the ETA and the Live badge** → goal: the tester can say "it arrives in N minutes and the badge says Live".
Satisfies FR2, FR3, IR2.

### T3 — Plan a trip that needs two vehicles and describe the steps
`Plan` → pick origin and destination → **Journey result** with one card per step → goal: the tester can name both vehicles and the transfer stop.
Satisfies FR4, IR6.

### T4 — Trigger SOS, then cancel it; then report a robbery
`Safety` → **hold** the SOS button for 2 s → countdown appears → **Cancel** → then `Report robbery` → submit → **Report received** → goal: the tester cancels in time and submits a report.
Satisfies FR5, IR3, IR6.

### U1 — Union flow: a breakdown becomes a commuter-visible alert
`Fleet` → select the vehicle → choose **Out of service** → write the note → **Preview** (exact text the commuter will read) → **Publish** → the commuter app shows the alert banner and the vehicle disappears from arrivals.
Satisfies FR7, FR8.

## 4. Screen inventory

| # | Screen | Key elements | Element ids |
| --- | --- | --- | --- |
| 1 | Home | alert banner, search field, 4 quick actions, next arrivals, saved-place shortcuts | `#homeAlerts` `#q` `#qaPlan` `#qaTrack` `#qaSos` `#qaRobbery` `#homePlaces` `#homeNearby` |
| 2 | Map | schematic SVG map: area labels, neighborhood texture, 8 route polylines, 30 stop points, simulated vehicles, filter chips, zoom | `#mapSvg` `.map-road` `.route-line` `.stop-dot` `.veh` `#mapChips` `#mapIn` `#mapOut` |
| 3 | Stop sheet | stop name, landmark name, landmark illustration, live/estimated badge, next arrivals, "plan from here" | `#sheet` `.landmark-svg` |
| 4 | Vehicle sheet | plate, model, driver, occupancy, status, delay, rating, rate button | `#sheet` |
| 5 | Routes | filter chips (All/Bus/Chinchi), search, 8 route cards | `#routeList` `#routeFilters` |
| 6 | Route detail | route header, stop list with per-stop ETAs, vehicles on route, reviews, rate button | `#routeBody` `.stoprow` `.vehiclecard` |
| 7 | Stop detail | stop header, landmark, routes serving this stop, arrivals | `#stopBody` |
| 8 | Plan | from/to fields, swap, suggestion chips, journey result cards | `#planFrom` `#planTo` `#planSuggestions` `#planResult` |
| 9 | Journey result | one card per step: board / ride / get off / transfer / walk, each with stop names and a reason | `#planResult .step` |
| 10 | Safety | big SOS hold button with progress ring, 5 s cancel countdown, separate robbery report button, my reports list | `#sosBtn` `#sosRing` `#sosCount` `#btnCancelSos` `#btnRobbery` `#safetyBody` |
| 11 | Review sheet | 5 stars, quick tags, optional comment, submit | `#sheet [data-star]` `#sheet [data-tag]` `#revSubmit` |
| 12 | Alerts | list of union alerts with route, severity, time | `#alertsBody` |
| 13 | More | language, accessibility, places, clock, connection, evaluation mode, reset, about | `#moreBody` |
| 14 | Union: Fleet | vehicle table, status panel, preview, publish | `#viewFleet` `#publishBtn` `#pvFrame` |
| 15 | Union: Calls | call log, acknowledge, log a new call | `#viewCalls` |
| 16 | Union: Alerts | published alert history | `#viewAlerts` |
| 17 | Union: Settings | union profile, demo clock, reset | `#viewSettings` |

## 5. Data model

```
Stop   { id, name, ur, kind: 'formal'|'informal', landmark, landmarkUr, x, y }
Route  { id, number, name, ur, type: 'bus'|'chinchi', stopIds[], path[[x,y]], speedKmh, fare, track: 'live'|'estimated' }
Vehicle{ id, plate, model, routeId, driver, phase, capacity, occupancy, tripNo }
Plan   { id, from, to, title, totalMin, walkMin, cost, steps[] }
Step   { kind: 'board'|'transfer'|'walk', routeNumber, fromStop, toStop, min, fare, reasonEn, reasonUr }
Alert  { id, routeId, routeNumber, severity, message, messageUr, createdAt, createdBy }
Report { id, type: 'sos'|'robbery', vehicleId, stopId, note, createdAt, status }
Review { id, targetType, targetId, stars, tags[], comment, createdAt }
Call   { id, vehicleId, driver, kind, note, time, acknowledged, ackedAt }
```

Data lives in `prototype/shared/data.js` (static, simulated) and `localStorage["kta_ops_v1"]` (everything the user or the union changes). A real deployment would replace `data.js` with an API client; the UI reads only through `KTA.sim`.

## 6. Architecture

| Layer | File | Responsibility |
| --- | --- | --- |
| Data | `shared/data.js` | Simulated stops, routes, vehicles, plans, unions, calls, reviews |
| Geometry | `shared/sim.js` → `KTA.geo` | Polyline projection, distance, point-at-parameter, heading |
| Simulation | `shared/sim.js` → `KTA.sim` | Vehicle motion along route paths, ETA model, dwell, congestion jitter, statuses, reviews, reports, alerts, planner |
| Store | `shared/sim.js` → `KTA.store` | `localStorage` persistence + `BroadcastChannel` + `storage` event fan-out |
| i18n | `shared/i18n.js` | EN/UR strings, `dir` switching, `t(key, vars)` |
| Assets | `shared/assets.js` | Inline landmark illustrations, icon set, star rendering (no network requests) |
| Evaluation | `shared/eval.js` | Task list T1–T4, event log, JSON/CSV export |
| UI | `commuter/`, `union/` | Rendering, event handling, accessibility modes |

## 7. Planner design

Two paths, same result shape:

1. **Prepared plans** (`data.js` → `PLANS`) for the pairs used in the evaluation, so a tester always gets a sensible, narrated journey.
2. **Fallback search** (`buildPlan`) for any other pair: a breadth-first search over a graph whose edges are *route legs* (stay on one vehicle between two of its stops) and *walk legs* (two stops within 46 px of each other, e.g. the chinchi point near Merewether Clock Tower and the bus stop near KPT Head Office).

Ranking prefers fewer chinchi legs, then fewer vehicles, then shorter time, because a bus trip is more predictable than a chinchi trip. Every generated step carries the stop names and a one-line reason in English and Urdu, which is what Phase 1 finding F9 asked for.

The prototype never claims a live AI model; the brief lists "real AI model behind the journey planner" as out of scope.

## 8. Safety design (FR5, IR3)

```
idle ──hold 2 s──► countdown(5 s) ──► report sent ──► "Report received"
  ▲                    │
  └── cancel ──────────┘
```

- The SOS button needs a **2 second hold**, so it cannot be triggered by a pocket touch.
- The **ring around the button fills** while holding, so the user sees that something is happening.
- A **5 second countdown with a visible Cancel button** follows, so the user can still stop it.
- Releasing the button early cancels the hold and says so.
- The **robbery report is a separate button**, so an SOS is never sent by mistake while reporting a robbery.
- Reports are stored with the stop, the vehicle (if known) and the time, and are listed under "My reports".

## 9. Accessibility and localization

| Feature | Implementation |
| --- | --- |
| One-handed use | Bottom tab bar within thumb reach; primary actions in the lower half; every list row ≥ 48 px high |
| Sunlight | High-contrast mode (`body.contrast`), stronger borders, no low-contrast greys on white |
| Large text | `body.large-text` scales type and row heights without breaking the layout |
| Urdu | Full EN/UR string table; `dir="rtl"` on the root; logical CSS properties so the layout mirrors automatically |
| Screen reader | `role="status"` on live banners, `aria-label` on icon-only buttons, visible focus rings |
| Not colour alone | Route type is a chip with a number and an icon, not only a colour; Live/Estimated badges carry text |

## 10. Failure and edge cases handled

| Case | Behaviour |
| --- | --- |
| Connection lost | Map keeps the last known positions, banner shows the age of the last update, ETAs are labelled "Last known" instead of "Live" (IR5) |
| Vehicle out of service | Removed from arrivals, drawn on the map with a cross, published as a route alert |
| No route found | The planner says so and suggests the nearest matching stops |
| Search with no result | An explicit "no results" message, not a blank list |
| Tracker stale (one bus) | Its ETA card says "last known · N min ago" instead of "Live" |
| Report without a network | The report is queued in the local store and listed in "My reports" |
