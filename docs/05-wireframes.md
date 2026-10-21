# 05 — Wireframes

Low-fidelity wireframes were drawn first, then upgraded to the high-fidelity HTML/CSS prototype. The drawings below are the low-fidelity plan, annotated with the element ids that implement them, so a reader can match a drawing to the running prototype.

Legend: `[ ]` button · `( )` chip · `▭` text field · `▤` card · `●` status dot · `░` image/illustration

---

## T1 — Find the bus (Home → search results → route detail)

### 1.1 Home

```
┌──────────────────────────────┐
│ Karachi Transit      EN/اردو ●│  ← app bar: language toggle, alerts, SOS
├──────────────────────────────┤
│ ░░ alert banner (if any) ░░ │  ← #homeAlerts  (FR8)
│                              │
│  Where do you want to go?    │  ← #q  (search)
│  ▭ Search a stop, route…     │
│                              │
│  [ Plan a trip ]             │  ← #qaPlan
│  [ Track on map ]            │  ← #qaTrack
│  [ SOS ]        [ Robbery ]  │  ← #qaSos  #qaRobbery
│                              │
│  Saved places               │  ← #homePlaces (recognition)
│  ( Home ) ( Work ) ( Uni )   │
│                              │
│  Recent searches            │  ← #homeRecent
│  ( Gulshan ) ( PECHS )       │
│                              │
│  Next arrivals              │  ← #homeNearby  (FR3, IR2)
│  ▤ B13 · ●Live · 4 min  Sardar│
│  ▤ B21 · ○Est  · 9 min  PECHS │
│                              │
│  Popular routes             │  ← #homeRoutes
│  ▤ [B13] Gulshan–Sea View  4′│
├──────────────────────────────┤
│  🏠Home  🗺Map  🚌Routes  🧭Plan  ☰More │
└──────────────────────────────┘
```

### 1.2 Search results

```
┌──────────────────────────────┐
│ ←  Results for "gulshan"     │  ← #homeResults
├──────────────────────────────┤
│  Routes                      │
│  ▤ [B13] Gulshan–Sea View     │
│  ▤ [B1]  Gulshan–Tariq Road   │
│  Stops                       │
│  ▤ Gulshan-e-Hadeed          │
│  ▤ Peoples Colony             │
│  ▤ Metro Station              │
│  No results message if empty │  ← explicit, never a blank list
└──────────────────────────────┘
```

### 1.3 Route detail

```
┌──────────────────────────────┐
│ ←  B13  Gulshan–Sea View     │  ← #routeTitle
│     Bus · 6 stops · ● Live   │
├──────────────────────────────┤
│  Stops on this route         │
│  ● Gulshan-e-Hadeed   4 min  │  ← .stoprow + .eta-card
│  ● Peoples Colony     9 min  │
│  ● Metro Station     14 min  │
│  ● PECHS              19 min │
│  ● Dolmen              24 min │
│  ● Sea View            29 min │
│                              │
│  Vehicles on this route      │  ← .vehiclecard
│  ▤ LEB-7788  Ayesha K.  ● Live│
│  ▤ LEB-9102  Shahid R.  ● Live│
│  ▤ LEB-4410 Bilal S.    ○ Est │
│                              │
│  Reviews  ★★★★☆  (12)       │
│  [ Rate this route ]         │  ← opens the review sheet
└──────────────────────────────┘
```

---

## T2 — Track the bus (Map → stop sheet / ETA card)

### 2.1 Map

```
┌──────────────────────────────┐
│ ←  Live map          ⚠ 2     │  ← #mapBtnAlerts
├──────────────────────────────┤
│ ░░░░ banner: B21 delayed ░░░ │  ← #mapBanner
│                              │
│      North Karachi           │
│         ╱                    │
│   ●──────────●               │  ← route polylines (.route-line)
│  │      ╲    │               │
│  │  Saddar ●───● Gulshan     │  ← ● = live vehicle (.veh)
│  │        ╲  │               │  ← ▪ = stop (.stop-dot)
│  │     ●─────● Sea View      │
│  │        PECHS              │
│  │  [B13] blue  [C1] green   │  ← #mapChips filter
│                              │
│  (−)  (fit)  (+)             │  ← #mapOut #mapFit #mapIn
├──────────────────────────────┤
│  🏠Home  🗺Map  🚌Routes  🧭Plan  ☰More │
└──────────────────────────────┘
```

### 2.2 Stop sheet (bottom sheet over the map)

```
┌──────────────────────────────┐
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │  ← drag handle
│  Ghanta Ghar (چنچی پوائنٹ)   │  ← stop name + Urdu
│  Landmark: clock tower       │  ← #sheet .landmark
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← #sheet .landmark-svg  (FR9)
│                              │
│  Next arrivals               │
│  ▤ [C1] ● Live      3 min     │
│  ▤ [B13] ○ Estimated  6 min   │
│                              │
│  [ Plan a trip from here ]   │
└──────────────────────────────┘
```

### 2.3 Vehicle sheet

```
┌──────────────────────────────┐
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
│  LEB-7788   B13              │
│  Volvo, capacity 40, 62% full│
│  Driver: Ayesha K.           │
│  Status: Running ●           │
│  ★★★★☆ 4.2 (9 reviews)      │
│  [ Rate / review ]  [ Report ]│
└──────────────────────────────┘
```

---

## T3 — Plan a trip (input → journey result)

### 3.1 Planner input

```
┌──────────────────────────────┐
│ ←  Plan a trip               │
├──────────────────────────────┤
│  From                        │
│  ▭ Saddar Jinnah Post Office │  ← #planFrom
│  [⇅]                          │  ← #btnSwap
│  To                           │
│  ▭ Gulshan-e-Hadeed          │  ← #planTo
│                              │
│  Try one of these            │  ← #planSuggestions
│  ( Sea View → Saddar )       │
│  ( North Karachi → PECHS )   │
│  [ Find a journey ]          │  ← #qaPlan
└──────────────────────────────┘
```

### 3.2 Journey result — one card per step (IR6)

```
┌──────────────────────────────┐
│ ←  Saddar → Gulshan           │
│  46 min · 1 change · Rs 40   │
├──────────────────────────────┤
│ ▤ 1  BOARD  B13              │
│   Saddar Jinnah Post Office  │
│   → Metro Station            │
│   "B13 is the bus that covers │
│    Saddar → Metro Station in  │
│    about 18 minutes."        │
│                              │
│ ▤ 2  CHANGE  Metro Station   │
│   "Change to B21 at Metro    │
│    Station. Both vehicles stop│
│    here, so the wait is short."│
│                              │
│ ▤ 3  BOARD  B21              │
│   Metro Station → Gulshan    │
│                              │
│ ▤ 4  WALK  4 min to          │
│   Gulshan-e-Hadeed           │
├──────────────────────────────┤
│  🏠Home  🗺Map  🚌Routes  🧭Plan  ☰More │
└──────────────────────────────┘
```

---

## T4 — Safety (SOS hold → countdown → sent) and review sheet

### 4.1 Safety screen, idle

```
┌──────────────────────────────┐
│ ←  Safety                    │
├──────────────────────────────┤
│                              │
│           ╭───────╮          │
│          │   SOS   │         │  ← #sosBtn, 96 px target
│           ╰───────╯          │
│   Hold for 2 seconds to send │  ← deliberate action (IR3)
│   an emergency alert with     │
│   your location.             │
│                              │
│  [ Report a robbery ]        │  ← #btnRobbery (separate action)
│                              │
│  My reports                  │  ← #safetyBody
│  ▤ SOS sent · 14:02 · Metro  │
└──────────────────────────────┘
```

### 4.2 Hold in progress (ring fills)

```
┌──────────────────────────────┐
│           ╭───────╮          │
│          │  ◜◝    │          │  ← #sosRing stroke-dashoffset
│          │   SOS  │          │     fills over 2 s
│           ╰───────╯          │
│      keep holding…           │
└──────────────────────────────┘
```

### 4.3 Countdown — cancel always available

```
┌──────────────────────────────┐
│           ╭───────╮          │
│          │   5    │          │  ← #sosCount
│           ╰───────╯          │
│   Sending in 5 seconds…      │
│                              │
│      [ Cancel ]              │  ← #btnCancelSos (always visible)
└──────────────────────────────┘
```

### 4.4 Report sent

```
┌──────────────────────────────┐
│           ✓                  │
│      Report received          │
│   SOS sent from Metro Station │
│   14:02 · shared with the     │
│   emergency contact            │
│                              │
│   [ Back to home ]            │
└──────────────────────────────┘
```

### 4.5 Review sheet (IR7 — under 15 seconds)

```
┌──────────────────────────────┐
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
│  Rate B13 / LEB-7788         │
│                              │
│      ★  ★  ★  ★  ★           │  ← 5 stars, tap once
│                              │
│  What stood out?             │
│  ( Clean ) ( Rude ) ( Fast ) │  ← one-tap tags
│  ( Late ) ( Comfortable )    │
│                              │
│  [ Add a short comment ]     │  ← optional
│                              │
│  [ Submit review ]           │
└──────────────────────────────┘
```

---

## Other screens

### Chinchi stop detail (FR9)

```
┌──────────────────────────────┐
│ ←  Ghanta Ghar (چنچی پوائنٹ)  │
├──────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← landmark illustration
│  Landmark: Ghanta Ghar clock  │
│  tower                       │
│  Served by: C1, C2           │
│  Next: [C1] Live 3 min        │
└──────────────────────────────┘
```

### Profile / More (FR10, IR4)

```
┌──────────────────────────────┐
│ ←  More                      │
├──────────────────────────────┤
│  Language                    │
│  ( English ) ( اردو )         │  ← #moreBody [data-lang]
│                              │
│  Accessibility               │
│  Larger text            [ ○ ] │  ← [data-setting="largeText"]
│  High contrast (sunlight)[ ○ ]│  ← [data-setting="contrast"]
│                              │
│  Saved places                │
│  ( Home ) ( Work )            │
│                              │
│  Demo clock speed            │
│  ( 1× ) ( 4× ) ( 12× )       │
│                              │
│  Simulate connection loss[ ○ ]│  ← [data-setting="offline"] (IR5)
│  Evaluation mode         [ ○ ]│  ← [data-setting="evalMode"]
│  About this prototype         │
│  [ Reset demo data ]         │
└──────────────────────────────┘
```

---

## U1 — Union portal: fleet list → vehicle status → alert preview

```
┌───────────────────────────────────────────────────────────────────────┐
│ KARACHI TRANSIT UNION PORTAL        B13 · Gulshan–Sea View    ⚙  ⤢  │
├────────────────┬──────────────────────────────────────────────────────┤
│  Fleet         │  Vehicle status                          [ Publish ] │
│  Driver calls  │  ┌────────────────────────────────────────────────┐  │
│  Alerts        │  │ LEB-7788   Volvo   B13   Driver: Ayesha K.     │  │
│  Settings      │  │ Status  ( Running ) ( Delayed ) ( Out of service)│ │
│                │  │ Delay  [  10  ] min                            │  │
│                │  │ Driver  [ Ayesha K.        ]  (reassign)        │  │
│                │  │ Note    [ Mechanical breakdown near Federal B ]│  │
│                │  └────────────────────────────────────────────────┘  │
│                │                                                      │
│                │  Commuter preview                                     │
│                │  ┌──────────────────────────────┐  ────────────────  │
│                │  │  B21 · Gulshan–Sea View      │  │ B21 is out of  │
│                │  │  ⚠ B21 is out of service…    │  │ service. The   │
│                │  │  Metro Station · 3 min      │  │ next bus is    │
│                │  └──────────────────────────────┘  │ 12 min away.   │
│                │  (live commuter app)                 └───────────────  │
└────────────────┴──────────────────────────────────────────────────────┘
```

| Wireframe | Implemented in |
| --- | --- |
| Home | `commuter/index.html` → `#screenHome`, `commuter/app.js` → `renderHome()` |
| Search results | `renderSearchResults()` → `#homeResults` |
| Route detail | `renderRouteDetail()` → `#routeBody` |
| Map | `renderMap()`, `buildMapSvg()` → `#mapSvg` |
| Stop sheet | `openStopSheet()` → `#sheet` |
| Vehicle sheet | `openVehicleSheet()` → `#sheet` |
| Planner input | `renderPlan()` → `#planFrom`, `#planTo`, `#planSuggestions` |
| Journey result | `renderPlanResult()` → `#planResult` |
| Safety | `renderSafety()` → `#safetyBody` |
| Review sheet | `openReviewSheet()` → `#sheet` |
| More / profile | `renderMore()` → `#moreBody` |
| Union fleet + status + preview | `union/portal.js` → `renderFleet()`, `renderVehiclePanel()`, `renderPreviewList()` |
| Union driver calls | `union/portal.js` → `renderCalls()` → `#viewCalls` |
| Union alerts | `union/portal.js` → `renderAlerts()` → `#viewAlerts` |
