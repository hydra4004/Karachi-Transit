# Karachi Transit — Phase 2 Prototype

An interactive prototype of a public transport app for Karachi commuters, plus the union portal that keeps the data true.

- **Commuter app** (mobile): browse bus and chinchi routes, track vehicles live on a map, plan a journey that needs more than one vehicle, send an SOS or a complaint report, and rate a driver or a vehicle.
- **Union portal** (desktop): unions set a vehicle's status, log the calls drivers make by phone, and publish alerts that appear in the commuter app within a second.

All vehicle positions, ETAs, routes and stops are **simulated**. There is no tracker hardware, no live feed and no real AI model behind the planner.

## Run it

```bash
# Windows
run.bat

# any platform
cd prototype
python -m http.server 8080
```

Then open <http://localhost:8080/> for the launcher and the demo script.

> A local server is needed for the portal and the app to talk to each other — they share state through `localStorage`, which is per-origin. The commuter app alone works fine when opened directly as a file.

## Test it

```powershell
powershell -ExecutionPolicy Bypass -File prototype\tests\run-tests.ps1
```

334 automated checks: 221 on the data and simulation engine, 88 driving the real commuter app in a browser, and 25 on the union-portal → commuter-app sync.

## Repository map

| Path | What it is |
| --- | --- |
| `prototype/index.html` | Launcher with the six-step demo script |
| `prototype/commuter/` | The commuter app (HTML, CSS, JS) |
| `prototype/union/` | The union portal (HTML, CSS, JS) |
| `prototype/shared/` | Data, simulation engine, store, i18n, artwork, evaluation logging, design system |
| `prototype/tests/` | The three test suites and the runner |
| `docs/` | The Phase 2 write-up (see below) |

## The Phase 2 write-up

| Document | Contents |
| --- | --- |
| `docs/PHASE2-SUBMISSION.md` | The assembled submission document, following the brief's structure |
| `docs/01-design-requirements.md` | Scope, evidence summary, personas, FR1–FR10, IR1–IR7, risks |
| `docs/02-conceptual-design.md` | Architecture, information architecture, task model, screen inventory, data model |
| `docs/03-hci-principles.md` | The 12 principles, the decision each one drives, and where it lives in the code |
| `docs/04-traceability-matrix.md` | Problem → finding → requirement → principle → decision → feature, plus what is verified how |
| `docs/05-wireframes.md` | Low-fidelity wireframes annotated with the element ids that implement them |
| `docs/06-evaluation-plan.md` | Tasks, success criteria, method, participant script, observation sheet, analysis plan |
| `docs/07-iteration-log.md` | Build-time iterations (real, verified) and the table for your study iterations |
| `docs/08-phase1-evidence-todo.md` | Every `[FILL]` value that has to come from your own Phase 1 work |
| `docs/09-prototype-guide.md` | How to run and demo the prototype, file map, demo controls, limitations |
| `docs/10-technical-reference.md` | Technical reference: every feature, every file, how each algorithm works, what libraries are used, and what is *not* implemented |

## Before you submit

1. Work through `docs/08-phase1-evidence-todo.md` and replace every `[FILL]` with your own numbers.
2. Fill in Section B of `docs/07-iteration-log.md` from your two study rounds, with before/after screenshots.
3. Update the evidence table and the personas in `docs/PHASE2-SUBMISSION.md`.
4. Re-run the tests and note the result.

## Technology

Vanilla HTML, CSS and JavaScript. No build step, no dependencies, no network requests — all artwork is inline SVG, and all fonts are system fonts. State is shared between the two apps through `localStorage` plus `BroadcastChannel`.
