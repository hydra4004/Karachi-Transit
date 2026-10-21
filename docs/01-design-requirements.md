# 01 — Design Requirements (Phase 2)

> Companion to the Phase 2 brief (`Phase 2 Solution Design and Prototype (Karachi Transit App).pdf`).
> Every bracketed `[FILL]` value below must be replaced with your own Phase 1 number before submission.
> See `08-phase1-evidence-todo.md` for the complete list of outstanding values.

## 1. Scope

| In scope for Phase 2 | Out of scope |
| --- | --- |
| Commuter app, mobile, four core tasks fully clickable | Real GPS hardware and live data |
| Union portal, 4 desktop sections | Real AI model behind the journey planner |
| Task-based evaluation with real users | Payments, ticketing, driver app |

**Products**

1. **Commuter app** (mobile, this repository: `prototype/commuter/`) — browse bus and chinchi routes with every stop; track vehicles live on a map with ETA per stop; plan a multi-vehicle journey; send an SOS or a robbery report; rate and review a driver, bus or chinchi.
2. **Union portal** (desktop, `prototype/union/`) — unions maintain routes, stops, vehicles and driver assignments; drivers have no portal, they phone the union, and a union operator updates the vehicle status, which commuters then see in the app.

**Assumptions**

- GPS trackers on vehicles are assumed, on the condition that unions agree to onboard. The prototype uses simulated location data.
- Each vehicle is assigned to one driver unless the union changes it in the database.
- Route, stop and ETA data are **simulated for the prototype** and are not a claim about the real network.

## 2. Phase 1 evidence summary (placeholder — replace with your data)

Phase 1 findings come from a short commuter survey (n = [FILL]) plus [FILL] follow-up interviews. None of the bracketed values below is a real figure yet.

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

Top problems named by respondents (Q9): [FILL — list the three most chosen]. Most common must-have request (Q16): [FILL].

## 3. Personas and scenarios

Adjust the ages, habits and quotes to match your own survey respondents before submission.

| | Ayesha, 20, university student | Bilal, 32, office worker new to the area | Mr. Qureshi, 50, union operator |
| --- | --- | --- | --- |
| Context | Rides a bus daily from home to campus; sometimes takes a chinchi for the last stretch | Rides 2 or 3 times a week; does not know which buses connect his new home and office | Manages a bus union's fleet by phone and a desk computer |
| Goal | Reach class on time and travel safely | Get to work without asking strangers for directions | Keep route data accurate and respond fast to driver calls |
| Frustration | Waits with no idea when the bus comes; feels unsafe at crowded stops | Needs two buses and cannot tell where to change | Updates by phone are slow, and commuters blame the union for wrong information |
| Tech comfort | High, Android, patchy mobile data | Medium, Android, prefers Urdu labels | Low to medium, prefers simple tables |
| Findings | F1, F2, F5 | F3, F4, F6, F7 | Union flow (FR7, FR8) |

**Scenarios**

- **S1 — waiting for a bus.** Ayesha is late for a 9:00 lecture. She opens the app, finds her route, sees the bus is 6 minutes away and live, and decides to wait instead of taking an expensive ride.
- **S2 — a two-bus journey.** Bilal types "Saddar to Gulshan". The planner returns bus A to a transfer stop, then bus B. He checks each step and follows it.
- **S3 — feeling unsafe.** At a crowded stop, Ayesha holds the SOS button. A countdown appears; she lets it finish and her report is sent with her location.
- **S4 — a breakdown.** A driver phones Mr. Qureshi about a breakdown. He marks the bus "out of service" in the portal, and commuters on that route see an alert within seconds.

## 4. Functional requirements

| ID | Requirement | Evidence | Where it lives in the prototype |
| --- | --- | --- | --- |
| FR1 | Commuters can browse all bus and chinchi routes and see every stop on each route | F4 | Routes tab → route detail (`#routeList`, `#routeBody`) |
| FR2 | Commuters can see live vehicle positions on a map | F1 | Map tab (`#mapSvg`, `.veh`, pan/zoom) |
| FR3 | Each stop shows an ETA for approaching vehicles | F1, F2 | Home "Next arrivals" cards and stop sheet (`#homeNearby`, `#stopBody`) |
| FR4 | The app builds a multi-vehicle journey from origin to destination | F3 | Plan tab (`#planResult`), prepared plans + BFS fallback |
| FR5 | Commuters can send an SOS or a robbery report | F5 | Safety screen (`#sosBtn`, `#btnRobbery`, `#safetyBody`) |
| FR6 | Commuters can rate and review a driver, bus or chinchi | F5 | Review sheet (`#sheet [data-star]`), route reviews block |
| FR7 | Union operators can update route, vehicle status and driver assignment in the portal | Union flow, Phase 1 context | Union portal Fleet + vehicle panel (`#viewFleet`, `#publishBtn`) |
| FR8 | Commuters see union alerts (delay, breakdown) on affected routes | F1 | Union publish → commuter alert banner (`#homeAlerts`, `#alertsBody`) |
| FR9 | Stops show a landmark name and photo, including informal chinchi stops | F6 | Stop sheet landmark SVG + landmark label (`#sheet .landmark-svg`) |
| FR10 | Commuters can switch between Urdu (right-to-left) and English | F7 | Language toggle in More + quick toggle in the app bar (`#btnLangQuick`) |

## 5. Interaction requirements

| ID | Requirement | Evidence | Where it lives in the prototype |
| --- | --- | --- | --- |
| IR1 | A commuter reaches a route result in 3 taps or fewer from the home screen | F3, F4 | Home → quick action "Routes" / search chip → route detail |
| IR2 | Every ETA shows whether it is live or estimated, and when it was last updated | F2 | `.badge.live` / `.badge.est` + "updated Ns ago" on every ETA card |
| IR3 | SOS needs a deliberate action (hold for 2 seconds) and can be cancelled during a countdown | F5 | 2 s hold → 5 s countdown → Cancel button (`#sosCount`, `#btnCancelSos`) |
| IR4 | Screens work one-handed, with large touch targets and high contrast for sunlight | Context of use; confirm in interviews | ≥48 px targets, bottom tab bar, high-contrast mode (`body.contrast`), large-text mode |
| IR5 | When the connection drops, the app shows the last known position with its age | Context of use; confirm in interviews | Offline banner (`#offlineBanner`) with age of the last update |
| IR6 | An AI journey plan lists each step with stop names, so the commuter can check it | F9 | Journey step cards, each with stop names and a reason (`#planResult .step`) |
| IR7 | A rating takes under 15 seconds, using stars and tags rather than typing | F5 | 5 stars + one-tap tags, optional one-line comment (`#sheet [data-tag]`) |

## 6. Non-functional and constraint requirements

| ID | Requirement | Reason |
| --- | --- | --- |
| NFR1 | The prototype must run with no build step and no network access | A prototype you can open on a laptop during evaluation is worth more than one you cannot |
| NFR2 | The prototype must work in English and Urdu with a right-to-left layout | FR10; F7 |
| NFR3 | The prototype must be operable on a phone screen in daylight | IR4 |
| NFR4 | The union portal must be legible at 1280×800 and also usable at 1440 width | Lab machines and projectors |
| NFR5 | No personal data of real people may be stored; all content is synthetic | Ethics and privacy |

## 7. Requirement conflicts, risks and assumptions

| # | Item | Handling in this prototype |
| --- | --- | --- |
| R1 | The Phase 2 brief calls the planner "AI-assisted"; no model may be used | The planner is a transparent graph search with an explanation per step, which is the part of "AI" that Phase 1 actually justified (F9: trust depends on seeing the reasoning). The UI does not claim an AI model. |
| R2 | Real route data was not available | All 30 stops, 8 routes and 14 vehicles are simulated in `prototype/shared/data.js`, in one place, so they can be replaced with a real feed without touching the UI. |
| R3 | Drivers have no app | The driver calls the union by phone; the union operator types what they heard into the portal. This is modelled as the "Driver calls" view. |
| R4 | Two apps, one screen | The union portal embeds the commuter app in an iframe so the operator can see the commuter view of their own change. |
| R5 | Offline behaviour is a requirement but no offline data exists | The prototype simulates a dropped connection (More → "Simulate connection loss") and shows the last known positions with their age. |

## 8. Out-of-scope list for the evaluation

Payments and ticketing, driver-facing app, real GPS, real AI model, real push notification service, production accounts or authentication, and any data about real routes or real people.
