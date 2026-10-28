# 06 — Evaluation Plan

## 1. What is being evaluated

The Phase 2 prototype is evaluated against the four commuter tasks and one union flow defined in the Phase 2 brief. The evaluation answers three questions:

1. Can a commuter complete the four core tasks with the prototype as built?
2. Where does the prototype fail, and why?
3. What is the effect of the changes made in round 1?

## 2. Tasks, success criteria and measures

| Task | What the tester does | Success | Measures |
| --- | --- | --- | --- |
| **T1** — Find the route | Find the bus that goes from a given stop to a given destination | Opens the correct route | Time to first correct action, taps, errors, wrong-route opens |
| **T2** — Track the vehicle | Track that bus and say when it reaches a given stop | Reads the ETA and the Live badge correctly | Time, errors, ETA read correctly (yes/no), badge noticed (yes/no) |
| **T3** — Plan a two-vehicle trip | Plan a trip that needs two vehicles and describe the steps | Names both vehicles and the transfer stop | Time, errors, steps understood, transfer stop named |
| **T4** — Safety | Trigger SOS, then cancel it; then report a robbery | Cancels the SOS in time and submits a report | Errors, hesitation (time before cancel), time, false trigger |
| **U1** — Union flow | Respond to a breakdown call by updating the vehicle and publishing an alert | Status changed and alert published; commuter view updates | Time, errors, preview used or not |

## 3. Method

| Item | Choice | Reason |
| --- | --- | --- |
| Participants | 5 per round, students and commuters, **not** the team | 5 users per round is the standard round size; the team knows the design and cannot un-learn it |
| Technique | Think-aloud | We need the reasons behind the errors, not only the errors |
| Sessions | 20–30 minutes per participant, same script for everyone | Comparable data across participants |
| Instrument | Observation sheet (task, time, taps, errors, quotes) + 10-question SUS + 1 open question | The brief's method, unchanged |
| Rounds | 2 — round 1 on the first prototype, round 2 after the fixes | The brief requires at least two iterations |
| Environment | Participant's own phone if possible, otherwise a lab phone; the union flow on a laptop | Real device use; the union portal is a desktop task |

### Round 1 vs round 2

- **Round 1** — run the tasks, record every problem, fix the high-impact ones, record the change in the iteration log with before/after screenshots.
- **Round 2** — repeat with new participants (5 more, ideally not the same people) and compare.

## 4. Participant script

**Introduction (read aloud, same words every time)**

> Thank you for coming. I am testing a phone app for public transport in Karachi. I want to see how you would use it. The app is not finished and it is not real — the buses and times are made up for the demo. Please think out loud: say what you are looking at, what you expect to happen, and what you are trying to do. I will not help you unless you ask me to, and if you get stuck for more than a minute I will tell you that we can move on. Do you have any questions before we start?

**Tasks (read the task only, then stay quiet)**

> **T1.** Using the app, find the bus that goes from *Sea View* to *Gulshan-e-Hadeed*.
> **T2.** Now track that bus and tell me when it will reach *PECHS*.
> **T3.** Plan a trip from *Saddar GPO* to *Gulshan-e-Hadeed* and describe the steps to me.
> **T4.** You feel unsafe at this stop. Use the app to raise an emergency alert, then cancel it. Afterwards, tell me how you would report a robbery.

**Close**

> What confused you? (one open question, then stop)

## 5. Observation sheet (copy one per participant)

```
Participant ID: ______   Round: ____   Date: ______   Phone: ____________
Language chosen: EN / UR   Contrast mode used: Y / N   Large text used: Y / N

Task T1  target: B21
  time to correct route open   ____:____        taps: ____
  errors: ______________________________________
  quotes: ______________________________________
  success:  Y / N        notes: ______________________________

Task T2  target: read ETA at PECHS + name the badge
  time to correct answer      ____:____        taps: ____
  ETA read correctly          Y / N
  badge "Live" noticed        Y / N
  errors: ______________________________________
  quotes: ______________________________________
  success:  Y / N        notes: ______________________________

Task T3  target: name both vehicles + transfer stop
  time to correct answer      ____:____        taps: ____
  both vehicles named         Y / N
  transfer stop named         Y / N
  errors: ______________________________________
  quotes: ______________________________________
  success:  Y / N        notes: ______________________________

Task T4  target: cancel SOS, then submit a robbery report
  time to cancel (hesitation)  ____:____        taps: ____
  false trigger (sent by accident)      Y / N
  report submitted            Y / N
  errors: ______________________________________
  quotes: ______________________________________
  success:  Y / N        notes: ______________________________

SUS score: ______ / 100
"What confused you?" ______________________________________________
```

## 6. Instrumented measurement (built into the prototype)

The prototype can log the same numbers automatically, which reduces observer error and gives a per-participant trace to check against the notes.

1. **More → Evaluation mode** (on).
2. **Select the participant ID** in the panel.
3. **Start task T1** … **end task T1** around each task.
4. At the end: **Export JSON** or **Export CSV** from the same panel.

What is recorded: `task_start`, `task_end`, `tap` (with the target element), `screen_change`, `search`, `plan`, `review`, `sos_*`, `error`, and the timestamp of each event. The export contains the event list, the per-task summary (duration, tap count, error count) and the SUS answers if they are typed in.

The instrumentation is passive: it records what happened, it does not instruct the participant, and the panel can be hidden during a session so the tester does not watch it.

## 7. Analysis plan

| Question | How it is answered |
| --- | --- |
| Did participants succeed? | Success rate per task (n = 5 per round) |
| Was it fast? | Median task time per task, round 1 vs round 2 |
| How many mistakes? | Error count per task, and a list of the error types |
| Did they understand the plan? | Did they name both vehicles and the transfer stop (T3)? |
| Was the SOS understood? | Hesitation time before cancel, false triggers, and SUS item on error prevention |
| Did they trust the data? | Did they mention the Live/Estimated badge and the update time (T2)? |
| Overall satisfaction | SUS score, round 1 vs round 2 |
| What confused people? | The open question, coded into themes |

**Decision rule for round 2:** any task with a success rate below 4/5, or a median time above [FILL] seconds, or any false SOS trigger, is treated as a blocking issue and must be fixed before round 2.

## 8. Threats to validity and how they are handled

| Threat | Handling |
| --- | --- |
| The designer is also the observer | The observation sheet is fixed and identical for all participants; the automated log is used for the numbers |
| Small sample | 5 per round is the brief's rule; the report states the sample size and avoids claiming statistical significance |
| Simulated data confuses participants | The script says up front that the data is made up, and the app says the same in More → About |
| Learning effect | Round 2 uses new participants where possible |
| The tester watches the evaluation panel | The panel can be collapsed; participants are not told it exists |
| The union flow was not tested with a participant | U1 is run with the union operator persona or a colleague, and is reported separately from the commuter results |

## 9. Reporting

The results go into the iteration log (`07-iteration-log.md`), which has one row per problem found, with the evidence from the session, the change made, the principle applied, and before/after screenshots. The comparison line at the end states the SUS score, the task success rate and the average task time for round 1 and round 2.
