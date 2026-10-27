# 09 — Prototype Guide

## 1. What this is

A clickable, self-contained prototype of two products for Karachi public transport:

- **Commuter app** — mobile, five bottom tabs, the four core tasks (T1–T4) runnable end to end.
- **Union portal** — desktop, four sections; a union operator changes a vehicle's status and the commuter app shows the result.

Everything runs in the browser with no build step, no package install and no network access. All route, stop, vehicle and ETA data is **simulated**.

## 2. Running it

### Option A — the easy way (recommended)

Double-click `run.bat` in the repository root. It starts a local server and opens the launcher page.

### Option B — manual

```bash
cd prototype
python -m http.server 8080
```

Then open <http://localhost:8080/>.

> Use a local server rather than opening the HTML files directly. The union portal and the commuter app talk to each other through `localStorage` and `BroadcastChannel`, which only work for pages on the same origin. Opening the files with `file://` gives each page a different origin, so the portal's updates will not reach the commuter app.

On narrow screens, the commuter app fills the viewport instead of appearing inside a device frame. The map uses the available portrait height and can be panned and zoomed to explore routes beyond the initial view.

### Option C — no server at all

Open `prototype/commuter/index.html` directly. Everything except the cross-app sync works.

## 3. The launcher

`prototype/index.html` is a small landing page with:

- a card for each product (commuter app, union portal),
- the six-step demo script,
- instructions for serving the folder locally,
- a note that all data is simulated.

## 4. Six-step demo script (about 3 minutes)

1. **Home** — show the search field, the four quick actions, the next arrivals with a **Live** badge and "updated Ns ago", and any union alert banner.
2. **Routes → B13** — open the route, read the six stops and the three vehicles, show the reviews.
3. **Map** — pan and zoom, tap the chinchi point at **Ghanta Ghar** to open the stop sheet with the landmark illustration, then tap a vehicle to see the plate, driver and rating.
4. **Plan** — set *Saddar Jinnah Post Office* → *Gulshan-e-Hadeed*; read the four step cards, including the reason for the change at the transfer stop.
5. **Safety** — hold the SOS button for two seconds, cancel during the five-second countdown, then send a robbery report and show "Report received".
6. **Union portal** (second tab) — select **LEB-7788**, choose *Out of service*, write a note, read the commuter preview, press **Publish**, and switch back to the commuter tab: the alert banner is there and the vehicle is gone from the arrivals.

Optional extras: switch to **Urdu** (the whole layout flips to right-to-left), turn on **High contrast**, and turn on **Simulate connection loss** to show the last-known-position behaviour.

## 5. File map

```
prototype/
├── index.html              launcher + demo script
├── shared/
│   ├── data.js             simulated stops, routes, vehicles, plans, unions, calls, reviews
│   ├── sim.js              geometry, simulation clock, ETA model, store, planner
│   ├── i18n.js             English + Urdu strings, RTL switching
│   ├── fonts/              bundled Noto Nastaliq Urdu font and SIL OFL license
│   ├── assets.js           landmark illustrations, icon set, stars (inline, no network)
│   ├── eval.js             evaluation mode: task log, summary, JSON/CSV export
│   └── app.css             shared design system
├── commuter/
│   ├── index.html          app shell: 5 tabs, screens, bottom sheet
│   ├── app.js              all commuter behaviour
│   └── app.css             commuter styles
├── union/
│   ├── index.html          portal shell: sidebar, 4 views, commuter preview iframe
│   ├── portal.js           fleet, status, calls, alerts, settings
│   └── portal.css          desktop layout
└── tests/
    ├── engine.test.js      218 data/engine checks (Node)
    ├── ui.test.html        49 browser checks of the real commuter app
    ├── sync.test.html      15 browser checks of portal → commuter sync
    └── run-tests.ps1       runs all three suites
```

## 6. The simulated data

| Item | Count | Notes |
| --- | --- | --- |
| Stops | 30 | Mix of formal bus stops and informal chinchi points named after landmarks |
| Routes | 8 | 5 bus (B13, B21, B1, B5, B22), 3 chinchi (C1, C2, C3) |
| Vehicles | 14 | One driver each; one has a deliberately stale tracker to demonstrate IR5 |
| Prepared journeys | 6 | Used by the planner for the evaluation pairs |
| Unions | 3 | Used by the portal |
| Driver calls | 3 | Seeded, including the breakdown that the demo publishes |
| Reviews | 5 | Seeded ratings so the average rating is not zero |

All of it lives in `prototype/shared/data.js`. To use a real feed, replace that file with a loader that fills the same shapes; nothing else has to change.

## 7. How the two apps stay in sync

Both apps read and write one `localStorage` key, `kta_ops_v1`:

```json
{
  "vehicles": { "v_b13_1": { "status": "out_of_service", "delayMin": 0, "note": "…" } },
  "alerts":   [ { "routeId": "r_b13", "severity": "out_of_service", "message": "…" } ],
  "reports":  [ … ], "reviews": [ … ], "calls": { … },
  "settings": { "lang": "en", "clockFactor": 4, "largeText": false, "contrast": false, "offline": false }
}
```

A write broadcasts a `BroadcastChannel` message, and other tabs pick it up through the `storage` event, so the union portal's change appears in the commuter app within a second.

## 8. Evaluation mode

**More → Evaluation mode** turns on logging. The panel that appears lets you:

- set a participant ID,
- start and end tasks T1–T4,
- see the live event log (taps, screen changes, errors),
- export the log as **JSON** or **CSV**.

The log is stored under `kta_eval_v1` in `localStorage` and never leaves the machine. See `06-evaluation-plan.md` for the study method.

## 9. Demo controls

| Control | Where | What it does |
| --- | --- | --- |
| Demo clock speed 1× / 4× / 12× | More | Speeds up or slows the simulation so buses visibly move and ETAs count down |
| Simulate connection loss | More | Freezes the simulation clock, keeps the last known positions, shows the age of the last update, and changes every "Live" badge to "Last known" |
| Larger text | More | Scales type and row heights |
| High contrast (sunlight) | More | Raises contrast for outdoor use |
| Evaluation mode | More | Turns on the task log |
| Reset demo data | More | Clears alerts, reports, reviews and settings |

## 10. Tests

```powershell
powershell -ExecutionPolicy Bypass -File prototype\tests\run-tests.ps1
```

- `engine.test.js` — 218 checks, pure Node, no browser.
- `ui.test.html` and `sync.test.html` — browser tests that drive the real app; the script starts a local server and runs them in headless Chrome. Open them manually in a browser if you prefer to watch them.

## 11. Known limitations

- All data is simulated; the app is a prototype, not a live service.
- The planner is a transparent graph search, not a machine-learning model (the brief lists a real model as out of scope).
- The map is a schematic diagram of Karachi, not a real map; there is no tile server and no geolocation.
- The SOS report is stored locally; nothing is sent to an emergency service.
- Driver phone calls are logged manually by the union operator, because drivers have no app.
