# Survey questionnaire — interview shell redesign

**Date:** 2026-09-19  
**Status:** Draft for review  
**Screen:** 04 Workshop Survey (wizard only; `/surveys` queue unchanged)  
**Approach:** Interview shell (hybrid pace)

## 1. Problem

Field teams experience the current 13-section wizard as a cramped form dump on phone/tablet. Progress is easy to lose in dense cards and matrix tables. We remake the **questionnaire UI/UX** so answering feels like a calm field interview while keeping schema, save/submit APIs, and validation rules locked.

## 2. Goals

| Goal | Signal |
|------|--------|
| Phone-first comfort | Large tap targets, one primary question visible for simple fields, sticky footer always reachable |
| Calm interview feel | Hero question typography, airy stage, no stacked form-card density |
| Hybrid pace | Simple fields one-at-a-time; likert/matrices/checklist/signature as full-section views |
| Parity | Same sections, answers, GPS, photos, Incomplete → jump → resubmit loop |

## 3. Non-goals

- Offline / PWA
- Schema or validation-rule changes
- New survey list API
- Redesign of `/surveys` ops queue (already shipped)
- Screen 05 selection scoring
- AI / purple chrome

## 4. Structure

```
┌─────────────────────────────────────┐
│ Context bar (sticky)                │
│  workshop code · status · section   │
│  progress + “Question x of y”       │
├─────────────────────────────────────┤
│ Question stage (main)               │
│  • Simple: ONE field                │
│  • Complex: FULL section            │
│  • Closing: GPS + photos in stage   │
│  • Incomplete panel above stage     │
├─────────────────────────────────────┤
│ Footer (sticky)  Back │ Next/Submit │
└─────────────────────────────────────┘
```

- Existing **13 questionnaire sections + Review** remain (`WIZARD_STEPS` + review).
- Consent decline still short-circuits to Review (unchanged product rule).

## 5. Visual language

- UNIDO tokens: primary `#0072A8` for interaction; navy chips for workshop code; orange for secondary emphasis (Incomplete / Fix); success/warning for Done / Needs work only.
- Cairo, RTL-first; logical CSS (`start`/`end`); no emoji status marks.
- Phone-first layout; stage widens on tablet/desktop without switching to multi-field simple sections.

## 6. Field rules

**One-at-a-time (simple):**  
`enum` | `multi` | `yesNo` | `string` | `text` | `email` | `phone` | `int` | `date`

**Full-section (complex):**  
`likert` | `matrix*` | `checklist` | `signature`  
Plus sticky first column / horizontal scroll on small screens; short “how to fill” line above the table.

**Media in stage:**  
basicInfo front photo; Closing GPS + documentation photos — same interview chrome.

**Review:**  
Section list with Done / Needs work text; Submit in sticky footer.

## 7. Navigation & save

| Action | Behavior |
|--------|----------|
| Next (simple) | Validate current field → advance field index; on last field, PUT section then next section |
| Next (complex) | Validate section → PUT section → next section |
| Back | Reverse field within section, else previous section |
| Incomplete jump | Open target section; for simple sections, first failing/required field when identifiable |
| Save | PUT `/surveys/{id}/sections/{key}` only when leaving a section (no per-field network save) |
| Toast | “Section saved” on successful PUT |
| GPS / photos | Existing dedicated endpoints |

## 8. States

- Loading: skeleton context + stage  
- No survey: start gate (existing)  
- Field error: inline + toast if Next pressed early  
- Incomplete: amber panel above stage; Fix jumps; resubmit from Review  
- Complete: success banner → workshop profile (existing timing)

## 9. Implementation sketch (for planning)

- New shell components under `src/features/surveys/components/` (e.g. `InterviewShell`, `QuestionStage`, sticky footer).
- Refactor `SurveyWizardPage` to drive **section index + field index** for simple sections.
- Reuse existing field renderers; restyle wrappers for interview density.
- Keep `schema.ts`, adapters, hooks, and `/surveys` queue untouched except shared badge/status if needed.
- Update wizard tests for one-question advance + section PUT on leave.

## 10. Success criteria

1. On a phone viewport, a simple section shows **one** primary question at a time with sticky Back/Next.  
2. A likert section still shows the full table in one stage, usable with horizontal scroll.  
3. Leaving a section still triggers a single section PUT; Incomplete jump and Review submit still work.  
4. RTL Arabic default remains correct (logical properties, mirrored chevrons only).

## 11. Open points (resolved in shaping)

| Topic | Decision |
|-------|----------|
| Pace | Hybrid (C) |
| Device | Phone-first, scale to tablet/desktop (C) |
| Scope | Full wizard; queue as-is (C) |
| Approach | Interview shell (1) |

---

**Review:** Approve this spec to proceed to an implementation plan (no code until then). Requested tweaks welcome inline.
