# Phase 2: Solution Design and Prototype — Karachi Transit App

**Student:** [FILL]
**Course / instructor:** [FILL]
**Date:** [FILL]
**Prototype location:** `prototype/` in this repository — open `prototype/index.html` after starting the local server, or run `run.bat`.

> All values in square brackets are placeholders that must be replaced with your own Phase 1 results before submission. They are listed in `docs/08-phase1-evidence-todo.md`.

---

## 1. Project overview and scope

The project is a public transport app for Karachi commuters, made of a commuter app (the main prototype) and a union portal (a smaller second prototype). Together they let commuters find, track and plan trips on buses and chinchi rickshaws, and let unions keep route and vehicle data current.

**Commuter app**

- Browse bus and chinchi routes, with every stop on each route.
- Track vehicles live on a map and see the estimated time of arrival (ETA) at each stop.
- Plan a journey that needs more than one vehicle, using a planner that returns "take bus A, get off at stop X, take bus B", with a reason for every step.
- Send an SOS or a robbery report.
- Rate and review a driver, bus or chinchi.

**Union portal**

- Bus and chinchi unions maintain routes, stops, vehicles and driver assignments.
- Drivers have no portal. In an emergency or breakdown, the driver phones the union, and a union operator updates the vehicle status. Commuters then see the change in the app.

**Assumptions**

- GPS trackers on vehicles are assumed, on the condition that unions agree to onboard. The prototype uses simulated location data.
- Each vehicle is assigned to one driver unless the union changes it in the database.

| In scope for Phase 2 | Out of scope |
| --- | --- |
| Commuter app, mobile, four core tasks fully clickable | Real GPS hardware and live data |
| Union portal, 4 desktop sections | Real AI model behind the journey planner |
| Task-based evaluation with real users | Payments, ticketing, driver app |

**How the two halves are one product.** The union portal is not a separate admin screen that the commuter never sees. It writes into the same store the commuter app reads, so a vehicle marked "out of service" by the union disappears from the arrival list and raises a route alert for the commuter within a second. That closed loop is the part of this project that answers Phase 1 finding F1 — commuters blame the union for wrong information, and the union has no way to correct it.

**Prototype status.** The prototype is a working HTML/CSS/JavaScript application, not a clickable picture. It has 30 simulated stops, 8 routes, 14 vehicles, a live-updating map, a journey planner, the full safety flow, reviews, and a union portal whose updates reach the commuter app in real time. It has 334 automated checks (`prototype/tests/`): 221 engine checks, 88 commuter UI checks, and 25 union-sync checks.

---

## 2. Phase 1 evidence summary

Phase 1 findings come from a short commuter survey (n = [FILL]) plus [FILL] follow-up interviews.

| ID | Finding | Source question | Result |
| --- | --- | --- | --- |
| F1 | Commuters wait with no information about the next vehicle | Q5, Q6 | [FILL]% wait more than 15 minutes |
| F2 | Commuters cannot tell when a vehicle will arrive | Q6 | Average ease rating [FILL] / 5 |
| F3 | Trips needing more than one vehicle are common and hard to plan | Q7, Q8 | [FILL]% switch vehicles often; difficulty [FILL] / 5 |
| F4 | Routes are learned by asking people, not from a reliable source | Q4 | [FILL]% ask conductors or other passengers |
| F5 | Safety is a concern on buses and chinchis | Q10, Q11 | [FILL]% feel unsafe sometimes or often |
| F6 | Chinchi stops are informal and identified by landmarks | Q12 | [FILL]% identify stops by landmark |
| F7 | Commuters want Urdu or both languages | Q13 | [FILL]% prefer Urdu or both |
| F8 | Live tracking and ETA are the most wanted features | Q14 | Top-rated: [FILL] at [FILL] / 5 |
| F9 | Trust in an AI-made route depends on seeing the reasoning | Q15 | [FILL]% say "depends" or "no" |

Top problems named by respondents (Q9): [FILL]. Most common must-have request (Q16): [FILL].

**What changed because of this evidence.** The survey said people wait in the dark with no idea when a bus is coming (F1, F2), so every ETA in the app carries a Live/Estimated badge and an update age rather than a bare number. It said multi-vehicle trips are hard to plan (F3), so the planner returns one card per step with the stop names written out (F9). It said chinchi stops are landmarks, not stops (F6), so every stop, including the informal ones, carries a landmark name and an illustration. It said people want Urdu (F7), so Urdu is a complete interface with a right-to-left layout, not a translation of a few labels.

---

## 3. Design requirements

The app has 10 functional and 7 interaction requirements, and each one points back to a Phase 1 finding from section 2. The full table, with the implementation and the check that verifies each one, is in `docs/04-traceability-matrix.md`.

### Functional requirements

| ID | Requirement | Evidence | Implemented in |
| --- | --- | --- | --- |
| FR1 | Commuters can browse all bus and chinchi routes and see every stop on each route | F4 | Routes tab → route detail |
| FR2 | Commuters can see live vehicle positions on a map | F1 | Map tab |
| FR3 | Each stop shows an ETA for approaching vehicles | F1, F2 | Home, stop sheet, route detail |
| FR4 | The app builds a multi-vehicle journey from origin to destination | F3 | Plan tab |
| FR5 | Commuters can send an SOS or a robbery report | F5 | Safety screen |
| FR6 | Commuters can rate and review a driver, bus or chinchi | F5 | Review sheet, route reviews |
| FR7 | Union operators can update route, vehicle status and driver assignment in the portal | Union flow, Phase 1 context | Union portal |
| FR8 | Commuters see union alerts (delay, breakdown) on affected routes | F1 | Union publish → commuter banner |
| FR9 | Stops show a landmark name and photo, including informal chinchi stops | F6 | Stop sheet, stop detail |
| FR10 | Commuters can switch between Urdu (right-to-left) and English | F7 | More → Language, app bar toggle |

### Interaction requirements

| ID | Requirement | Evidence | Implemented in |
| --- | --- | --- | --- |
| IR1 | A commuter reaches a route result in 3 taps or fewer from the home screen | F3, F4 | Home → Routes → route (2 taps) |
| IR2 | Every ETA shows whether it is live or estimated, and when it was last updated | F2 | `.badge.live` / `.badge.est` + age |
| IR3 | SOS needs a deliberate action (hold for 2 seconds) and can be cancelled during a countdown | F5 | Hold 2 s → 5 s countdown → Cancel |
| IR4 | Screens work one-handed, with large touch targets and high contrast for sunlight | Context of use; confirm in interviews | 48 px targets, bottom actions, contrast mode |
| IR5 | When the connection drops, the app shows the last known position with its age | Context of use; confirm in interviews | Offline banner + "Last known" badges |
| IR6 | An AI journey plan lists each step with stop names, so the commuter can check it | F9 | Step cards with names and reasons |
| IR7 | A rating takes under 15 seconds, using stars and tags rather than typing | F5 | 5 stars + one-tap tags |

---

## 4. Personas and scenarios

| | Ayesha, 20, university student | Bilal, 32, office worker new to the area | Mr. Qureshi, 50, union operator |
| --- | --- | --- | --- |
| Context | Rides a bus daily from home to campus; sometimes takes a chinchi for the last stretch | Rides 2 or 3 times a week; does not know which buses connect his new home and office | Manages a bus union's fleet by phone and a desk computer |
| Goal | Reach class on time and travel safely | Get to work without asking strangers for directions | Keep route data accurate and respond fast to driver calls |
| Frustration | Waits with no idea when the bus comes; feels unsafe at crowded stops | Needs two buses and cannot tell where to change | Updates by phone are slow, and commuters blame the union for wrong information |
| Tech comfort | High, Android, patchy mobile data | Medium, Android, prefers Urdu labels | Low to medium, prefers simple tables |
| Findings | F1, F2, F5 | F3, F4, F6, F7 | Union flow (FR7, FR8) |

**Scenarios**

- **S1 — waiting for a bus.** Ayesha is late for a 9:00 lecture. She opens the app, finds her route, sees the bus is 6 minutes away and live, and decides to wait instead of taking an expensive ride. → *Home → Routes → B13 → Map.*
- **S2 — a two-bus journey.** Bilal types "Saddar to Gulshan". The planner returns bus A to a transfer stop, then bus B. He checks each step and follows it. → *Plan → journey result.*
- **S3 — feeling unsafe.** At a crowded stop, Ayesha holds the SOS button. A countdown appears; she lets it finish and her report is sent with her location. → *Safety.*
- **S4 — a breakdown.** A driver phones Mr. Qureshi about a breakdown. He marks the bus "out of service" in the portal, and commuters on that route see an alert within seconds. → *Union portal → Fleet → Publish.*

---

## 5. Task model and user flows

The commuter app has four core tasks (T1–T4) and the union portal has one flow (U1). Each runs from start to goal in four steps. The step-by-step flows, with the screens involved, are in `docs/02-conceptual-design.md` §3.

| Task | Start | Steps | Goal |
| --- | --- | --- | --- |
| T1 — find the route | Home | tap Routes → tap route → read the stop list | the correct route is open |
| T2 — track the vehicle | Home / Map | tap the ETA card → map focuses the vehicle → tap the stop | the tester can say when it arrives and that the badge says Live |
| T3 — plan a two-vehicle trip | Plan | set origin and destination → read the step cards | both vehicles and the transfer stop are named |
| T4 — safety | Safety | hold SOS 2 s → cancel in the countdown → open the robbery report → submit | the SOS was cancelled in time and the report was submitted |
| U1 — union response | Union portal | select the vehicle → set the status → write the note → publish | the commuter app shows the alert |

---

## 6. Information architecture and wireframe plan

The commuter app has five bottom tabs, and the union portal has a sidebar of four sections. The low-fidelity wireframes, annotated with the element ids that implement them, are in `docs/05-wireframes.md`.

| Commuter tab | Contents | Union sidebar | Contents |
| --- | --- | --- | --- |
| **Home** | alerts, search, quick actions, saved places, next arrivals | **Fleet** | vehicle table, status panel, alert preview, commuter preview |
| **Map** | live vehicles, 8 route lines, 30 stop points, filter chips, pan/zoom | **Driver calls** | call log, acknowledge, log a call |
| **Routes** | filter by bus/chinchi, search, 8 route cards | **Alerts** | published alert history |
| **Plan** | from/to, swap, suggestions, journey step cards | **Settings** | union profile, demo clock, reset |
| **More** | language, accessibility, places, clock, connection, evaluation mode, reset | | |

Wireframes drawn first (low fidelity, then mid fidelity):

- Commuter, T1: Home, search results, route detail with stop list.
- Commuter, T2: Map with live vehicles, stop and ETA card.
- Commuter, T3: Journey planner input, journey result with step cards.
- Commuter, T4: SOS hold, cancel countdown, report sent, review sheet.
- Commuter, other: Chinchi stop detail with landmark photo, Profile with language toggle.
- Union, U1: Fleet list, set vehicle status, alert preview.

---

## 7. HCI principles and design decisions

Each major design decision rests on one named usability principle. The complete table, with the file and function where each decision lives, is in `docs/03-hci-principles.md`.

| Principle | Design decision | Requirement |
| --- | --- | --- |
| Visibility of system status | ETA card with a Live or Estimated badge and "updated 20s ago" | IR2, FR3 |
| Feedback | Tapping a stop highlights it on the map and shows a confirmation; a sent report shows a clear "Report received" screen | FR5, FR6 |
| Error prevention | SOS needs a 2 second hold, then a 5 second cancel countdown; SOS and robbery report are separate buttons | IR3 |
| User control and freedom | Cancel is always visible on the SOS countdown and on journey results | IR3 |
| Recognition rather than recall | Saved-place shortcuts and searchable route/stop names reduce recall; the route list is not duplicated on Home | IR1 |
| Reduce cognitive load | The journey planner shows one step per card (board, ride, get off) instead of a dense map of lines | IR6, FR4 |
| Match between system and real world | Landmark names, photos and Urdu labels for chinchi stops | FR9 |
| Consistency and standards | Same bus card, ETA format and colour for each route across Home, Map and Routes | FR1, FR3 |
| Flexibility and efficiency | Search by stop, route number or destination; shortcut chips for Home and Work | IR1 |
| Accessibility and localization | Urdu right-to-left layout, large touch targets, high-contrast colours | FR10, IR4 |
| Help users recover from errors | If connection drops, show the last known position with its age rather than a blank map | IR5 |
| Explainability (trust) | Each AI step names the stop and the reason for the transfer | IR6 |

---

## 8. Traceability chain

The full chain — every row from user problem to prototype feature, plus the requirement → implementation → verification table — is in `docs/04-traceability-matrix.md`.

| User problem | Research finding | Design requirement | HCI principle | Design decision | Prototype feature |
| --- | --- | --- | --- | --- | --- |
| Waits with no idea when the vehicle arrives | F1, F2 | FR2, FR3, IR2 | Visibility of system status | ETA card with Live or Estimated badge and update time | Stop screen with ETA, live map |
| Cannot plan a trip that needs two vehicles | F3 | FR4, IR6 | Reduce cognitive load | One step per card with board, ride and get-off stops | Journey planner results |
| Does not trust an AI-made route | F9 | IR6 | Explainability, recognition over recall | Each step names the stop and why to change | Journey step cards |
| Learns routes by asking strangers | F4 | FR1, IR1 | Recognition over recall, efficiency | Route list with search by number, stop or destination, in 3 taps | Home, Routes, Search |
| Feels unsafe, fears accidental or missed alerts | F5 | FR5, IR3 | Error prevention, user control | Hold-to-confirm SOS with cancel countdown | SOS and report flow |
| Cannot judge a driver or vehicle before boarding | F5 | FR6, IR7 | Consistency, efficiency | Star rating plus quick tags, under 15 seconds | Review sheet |
| Chinchi stops have no formal names | F6 | FR9 | Match with the real world | Landmark name, photo and Urdu label | Chinchi stop detail |
| Prefers Urdu labels | F7 | FR10 | Accessibility and localization | Language toggle with right-to-left layout | Settings, all screens |
| No warning about breakdowns | F1 | FR7, FR8 | Visibility, feedback | Union status change becomes a route alert | Union portal status screen, commuter alert banner |

---

## 9. Prototype and evaluation plan

The prototype is a working application with simulated data: a mobile commuter app that supports the four tasks end to end, and four desktop sections for the union portal (fleet list, mark a vehicle delayed or out of service, alert preview, driver-call log). The planner is a transparent search over the stop network with a written reason for every step, not a live model — "real AI model behind the journey planner" is out of scope in the brief.

### Evaluation tasks

| Task | What the tester does | Success | Measures |
| --- | --- | --- | --- |
| T1 | Find the bus that goes from a given stop to a given destination | Opens the correct route | Time, taps, errors |
| T2 | Track that bus and say when it reaches a given stop | Reads the ETA and the Live badge correctly | Time, errors, ETA read correctly |
| T3 | Plan a trip that needs two vehicles and describe the steps | Names both vehicles and the transfer stop | Time, errors, steps understood |
| T4 | Trigger SOS, then cancel it; then report a robbery | Cancels SOS in time and submits a report | Errors, hesitation, time |

### Method

- 5 test users per round (students and commuters, not the team), think-aloud while they work.
- After each round, a 10-question System Usability Scale (SUS) form and one open question: "What confused you?"
- Record the task times, tap counts and every error on the observation sheet in `docs/06-evaluation-plan.md`.
- Two rounds: round 1 on the first prototype, round 2 after the fixes.
- The prototype can also log all of this by itself: **More → Evaluation mode** records taps, screen changes, task times and errors, and exports them as JSON or CSV.

---

## 10. Iteration log

The build-time iterations are recorded with their evidence in `docs/07-iteration-log.md` Section A. Ten real problems were found and fixed during construction, each one verified by an automated test that now passes: the unreachable SOS countdown, a planner that could not connect two parts of the network, transfer cards appearing on single-vehicle journeys, a map that lied about being "Live" while the connection was down, the missing way to simulate a dropped connection, a map layer that swallowed taps on stops, a blank area under an empty search, a screen that jumped while being read, an ETA calculation that threw on some vehicles, and a union alert preview that did not match the published text.

The study iterations go in the same file, Section B. Fill in one row per problem found, with before and after screenshots.

| Round | Problem observed | Evidence | Change made | Principle applied | Screenshots |
| --- | --- | --- | --- | --- | --- |
| 1 | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |
| 1 | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |
| 2 | [FILL] | [FILL] | [FILL] | [FILL] | [FILL] |

**Result of round 1 vs round 2:** SUS score [FILL]; task success rate [FILL]; average task time [FILL].

---

## 11. Honesty and limitations

- Every number about routes, vehicles, ETAs and unions in the prototype is simulated. The app says so in **More → About**, and the launcher page repeats it.
- The journey planner is a graph search with written explanations, not a machine-learning model.
- The map is a schematic diagram of Karachi, not a real map, and the app never asks for the device's location.
- SOS and robbery reports are stored on the device; nothing is sent to an emergency service.
- The Phase 1 figures in section 2 are placeholders until you replace them with your own results.

## 12. How to run the prototype

```bash
cd prototype
python -m http.server 8080
```

Open <http://localhost:8080/> for the launcher and the six-step demo script. The union portal and the commuter app must be served from the same origin for their shared state to work. Full details, including the demo controls and the file map, are in `docs/09-prototype-guide.md`.
