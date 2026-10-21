# 08 — Phase 1 Evidence To-Do List

The Phase 2 brief contains bracketed placeholders because the evidence must come from **your own Phase 1 work**. Nothing below is a real result yet. This file lists every value that has to be supplied, where it is used, and how to obtain it.

## 1. Headline numbers

| # | Placeholder | Where it appears | How to get it |
| --- | --- | --- | --- |
| 1 | Survey sample size `n = [fill in]` | Brief §2, `01-design-requirements.md` §2 | The number of survey responses you collected |
| 2 | Number of follow-up interviews `[fill in]` | Brief §2, `01-design-requirements.md` §2 | The number of interviews you ran |
| 3 | Top three problems named by respondents (Q9) | Brief §2, `01-design-requirements.md` §2 | The three most frequently selected answers in your survey |
| 4 | Most common must-have request (Q16) | Brief §2, `01-design-requirements.md` §2 | The most frequently selected request in your survey |

## 2. Finding results (F1–F9)

| ID | Placeholder | Source question | How to compute it from your data |
| --- | --- | --- | --- |
| F1 | `[__%] wait more than 15 minutes` | Q5, Q6 | Share of respondents whose Q5/Q6 answer falls in the "more than 15 minutes" band |
| F2 | Average ease rating `[__ / 5]` | Q6 | Mean of the Q6 rating column |
| F3 | `[%] switch vehicles often; difficulty [ / 5]` | Q7, Q8 | Share selecting "often" for Q7, and the mean of the Q8 difficulty scale |
| F4 | `[__%] ask conductors or other passengers` | Q4 | Share selecting the conductor/passenger option in Q4 |
| F5 | `[__%] feel unsafe sometimes or often` | Q10, Q11 | Share selecting "sometimes" or "often" in Q10 |
| F6 | `[__%] identify stops by landmark` | Q12 | Share answering "yes" to Q12 |
| F7 | `[__%] prefer Urdu or both` | Q13 | Share selecting "Urdu" or "Both" in Q13 |
| F8 | Top-rated feature `[feature]` at `[__ / 5]` | Q14 | The feature with the highest mean rating in Q14, and that mean |
| F9 | `[__%] say "depends" or "no"` | Q15 | Share selecting "depends" or "no" to the trust question |

## 3. Personas

| # | Placeholder | Where | How to fix it |
| --- | --- | --- | --- |
| 5 | Ayesha's age, university and daily habit | `01-design-requirements.md` §3, brief §4 | Use a real participant from your survey who matches the persona |
| 6 | Bilal's age, job and how often he rides | same | Same |
| 7 | Mr. Qureshi's age and union | same | Interview a union official if you can; otherwise mark it as a composite and say so |
| 8 | Each persona's direct quote | same | Add a real quote from your interviews or survey free-text answers |

> If you use a composite persona, write one sentence saying so. Being explicit about a composite is better than presenting it as a real person.

## 4. Context-of-use claims (IR4, IR5)

IR4 ("screens work one-handed, with large touch targets and high contrast for sunlight") and IR5 ("when the connection drops…") are marked in the brief as *"Context of use; confirm in interviews"*.

| # | What to do |
| --- | --- |
| 9 | Add an interview question that asks how people hold the phone, where they wait, and whether they use the phone in bright sunlight. Record the answers as quotes. |
| 10 | Add an interview question about data: what happens to their phone when the network drops, and what they do instead. Quote the answer. |
| 11 | Update `01-design-requirements.md` §5 so IR4 and IR5 cite your evidence instead of "Context of use" |

## 5. Evaluation results

| # | Placeholder | Where |
| --- | --- | --- |
| 12 | SUS score for round 1 and round 2 | `06-evaluation-plan.md`, `07-iteration-log.md` |
| 13 | Task success rate per task, per round | `07-iteration-log.md` |
| 14 | Average task time per task, per round | `07-iteration-log.md` |
| 15 | Every problem found in round 1 and round 2, with evidence | `07-iteration-log.md` §Section B |
| 16 | Before/after screenshots for each change | `07-iteration-log.md` §Section B |

## 6. Where the placeholders live in the code and documents

| File | Placeholders to replace |
| --- | --- |
| `docs/01-design-requirements.md` | §2 evidence table, §3 persona table, §5 IR4/IR5 evidence column |
| `docs/07-iteration-log.md` | Section B table and the round 1 vs round 2 result line |
| `docs/PHASE2-SUBMISSION.md` | §2 evidence table, §4 persona table, §10 iteration table |
| `docs/04-traceability-matrix.md` | The finding column may be annotated with your numbers |
| `docs/06-evaluation-plan.md` | The decision rule threshold `[FILL] seconds` |

## 7. Honesty rules for this section

- If you did not collect a number, write "not collected" rather than inventing one.
- If a number comes from a different source than the survey (for example, a published report on Karachi bus routes), name the source and the date.
- Percentages should be given with the raw count, e.g. "18 of 24 (75%)", because a percentage on a small sample reads as more certain than it is.
- The prototype's simulated data must never be presented as real route data. The app says so in More → About, and the submission document repeats it.
