# 03 — HCI Principles and Design Decisions

Each major design decision in the prototype rests on one named usability principle (Nielsen's heuristics plus cognitive-load guidance). Every row names where the decision is implemented so it can be checked during the evaluation.

| # | Principle | Design decision | Requirement | Where to look in the prototype |
| --- | --- | --- | --- | --- |
| 1 | **Visibility of system status** | ETA card with a Live or Estimated badge and "updated 20s ago"; the demo clock shows the simulation speed | IR2, FR3 | `commuter/app.js` → `etaCardHtml()`; every arrival card in Home, Stop and Route screens |
| 2 | **Feedback** | Tapping a stop highlights it on the map and opens a stop sheet; a sent report shows a clear "Report received" screen; the union preview shows the exact text the commuter will read | FR5, FR6, FR8 | `openStopSheet()`, `renderSafety()`, `union/portal.js` → `buildMessage()` / `#pvNote` |
| 3 | **Error prevention** | SOS needs a 2 second hold, then a 5 second cancel countdown; SOS and robbery report are separate buttons | IR3 | `bindSosButton()`, `#sosBtn`, `#btnRobbery` |
| 4 | **User control and freedom** | Cancel is always visible on the SOS countdown; a journey result can be discarded; the map zoom/filter can be reset; the demo data can be reset | IR3 | `#btnCancelSos`, `#mapFit`, "Reset demo data" in More |
| 5 | **Recognition rather than recall** | Saved-place shortcuts, route chips and searchable route/stop names reduce the need to remember route numbers | IR1 | `#homePlaces`, `#q`, route chips in Routes |
| 6 | **Reduce cognitive load** | The journey planner shows one step per card (board, ride, get off) instead of a dense map of lines | IR6, FR4 | `#planResult .step` — 4 cards for a 2-vehicle journey |
| 7 | **Match between system and the real world** | Landmark names, landmark illustrations and Urdu labels for chinchi stops; the map uses real area names | FR9 | `shared/assets.js` landmark SVGs, `stop.landmark`, Urdu stop names |
| 8 | **Consistency and standards** | The same bus card, ETA format and colour for each route across Home, Map and Routes; a route always wears its own colour | FR1, FR3 | `routeColor()`, `.routechip`, `.eta-card` used in three screens |
| 9 | **Flexibility and efficiency** | Search by stop, route number or destination; shortcut chips for Home and Work; 3-tap path to a route | IR1 | `#q` search in the app bar, `#homePlaces`, Home → Routes → route |
| 10 | **Accessibility and localization** | Urdu right-to-left layout, large touch targets, high-contrast colours, larger-text mode | FR10, IR4 | `shared/i18n.js` + `dir="rtl"`, `body.contrast`, `body.large-text` |
| 11 | **Help users recover from errors** | If the connection drops, the app shows the last known position with its age instead of a blank map; a stale tracker is labelled "last known" | IR5 | `#offlineBanner`, `sim.js` → `isOffline()` / `offlineAgeSec()` |
| 12 | **Explainability (trust)** | Each journey step names the stop and the reason for the transfer, in English and Urdu | IR6 | `sim.js` → `planFromLegs()` writes `reasonEn` / `reasonUr` on every step |

## How the principles were applied, in more detail

### 1. Visibility of system status
The Phase 1 complaint was waiting in the dark with no idea when the vehicle would come. Every ETA in the prototype therefore carries three things, never one: **the number of minutes**, **a badge that says whether the number is live or estimated**, and **how long ago the data was updated**. A bus whose tracker has gone quiet (`v_b13_2`) deliberately shows "last known · 3 min ago" so the difference between "live" and "stale" is visible, not implied.

### 2. Feedback
Feedback is immediate and specific. Tapping a stop dot opens a sheet that names the stop, its landmark and the next arrivals; tapping a vehicle opens a sheet with the plate, driver, occupancy and status. After sending a report the screen changes to "Report received" with the stop and time, so the user knows the action worked rather than assuming it did. In the union portal, the alert preview is written in the commuter's words *before* publishing, so the operator can see the consequence of the button they are about to press.

### 3 & 4. Error prevention and user control
The SOS flow is the riskiest interaction in the app, so it is designed in three layers: a deliberate 2 second hold (so it cannot fire by accident), a visible filling ring (so the user knows the hold registered), and a 5 second countdown with a permanent Cancel button (so the user can still stop it). The robbery report is a separate button so that reporting a robbery never sends an SOS by accident. Every other irreversible action in the app is a normal button press, because only the SOS has a genuinely dangerous failure mode.

### 5 & 9. Recognition over recall, flexibility and efficiency
Commuters currently learn routes by asking people (F4). The Home screen keeps saved places (Home, Work) and upcoming arrivals close at hand; search accepts a stop name, a route number or an area name at once. The complete route list has one clear home in the Routes tab rather than being repeated on Home. A commuter who knows only "the bus that goes past Sea View" can still find it without knowing the route number.

### 6. Reduce cognitive load
A two-vehicle journey is the hardest thing in this domain (F3), and the brief's own flow is "take bus A, get off at stop X, take bus B". The planner therefore returns a **sequence of cards, not a map**: one card to board, one to get off, one to change, one to walk. Each card repeats the stop name and the reason, so the user can check the plan against what they see on the ground instead of holding a whole route in their head.

### 7. Match with the real world
Chinchi stops have no sign; they are a bakery, a petrol pump, a mosque gate (F6). The prototype names them the way people name them, shows a simple line illustration of the landmark, and gives the Urdu name, so the user recognises the place they are standing in.

### 8. Consistency
The same route chip colour, the same ETA layout and the same wording are used in Home, Map, Routes and the journey result. A route number is always blue for a bus and green for a chinchi, and the number is always printed, so colour is never the only signal.

### 10. Accessibility and localization
Urdu is a first-class language, not a translation layer: the whole interface flips to right-to-left through CSS logical properties, and every user-facing string exists in Urdu. Touch targets are at least 44 px (48 px on map controls), interactive settings are native keyboard-operable switches, and a high-contrast mode raises border and text contrast for use in daylight. Navigation indicates the current destination to assistive technology.

## Platform conventions adapted for the web

The interface borrows platform conventions that support clarity: concise task labels, a predictable bottom navigation, visible selection state, direct manipulation of the map, and clear separation between navigation surfaces and information. Translucent Liquid Glass-inspired styling is restrained to navigation and map controls; dense text, forms, and arrival information remain opaque and legible. Reduced-transparency, high-contrast, forced-colors, and reduced-motion preferences disable decorative effects. This is an HTML/CSS approximation, not native Apple Liquid Glass or a claim of Apple design certification.

### 11. Recovery from errors
A dropped connection is normal in Karachi, so the app does not go blank. It freezes the last known vehicle positions, shows a banner with the age of the last update, and changes every "Live" badge to "Last known" so the user is never misled about how fresh the data is.

### 12. Explainability
Phase 1 found that trust in an AI-made route depends on seeing the reasoning (F9). Every step says which vehicle, between which stops, how long, and why the change is made there ("Both vehicles stop here, so the wait is short"). The explanation is written for the user, not for the system.

## Principles deliberately *not* applied

| Situation | Why |
| --- | --- |
| No modal dialogs for ordinary confirmations | A modal interrupts the task and hides the context; the only modal-like interruption in the app is the safety flow, where it is warranted |
| No hidden gestures | A swipe-only action would fail for the low-tech-comfort union operator and for users with limited dexterity; every action has a visible button |
| No auto-play animation | The map updates once per second with no movement the user has to chase; the simulation clock can be slowed to 1× for observation |
