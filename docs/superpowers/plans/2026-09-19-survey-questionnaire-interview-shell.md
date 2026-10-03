# Survey Questionnaire Interview Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remake the survey wizard UI into a phone-first interview shell: one simple field per screen, full-section views for likert/matrices, sticky context + footer — schema and APIs unchanged.

**Architecture:** Keep `schema.ts`, adapters, and hooks. Extract pure navigation helpers (`isSimpleField`, field-index advance/leave-section PUT). Replace `SurveyWizardPage` layout with `InterviewShell` + stage content. Reuse `FieldRenderer` / `ComplexFieldRenderer` inside a single-question or full-section stage.

**Tech Stack:** Next.js 16 App Router, React client components, TanStack Query (existing survey hooks), Tailwind v4 + RAC-DAMP tokens, Vitest + Testing Library, existing i18n (`useT`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-19-survey-questionnaire-interview-shell-design.md`
- Do **not** change survey schema, section keys, validation rules, or REST contracts
- Do **not** redesign `/surveys` queue
- UNIDO palette only; no purple/AI chrome; no emoji status marks
- Arabic RTL default; logical CSS (`start`/`end`); Cairo
- Commits: only when the user explicitly asks (repo rule)

---

## File map

| File | Responsibility |
|------|----------------|
| `src/features/surveys/utils/interview-nav.ts` | Pure helpers: simple vs section-mode, field indices, next/back targets |
| `src/features/surveys/utils/interview-nav.test.ts` | Unit tests for navigation helpers |
| `src/features/surveys/components/InterviewShell.tsx` | Sticky context bar, progress, sticky footer slots |
| `src/features/surveys/components/QuestionStage.tsx` | Single-field layout (label hero + control + error) |
| `src/features/surveys/components/SectionStage.tsx` | Full-section layout + “how to fill” + scroll wrapper |
| `src/features/surveys/components/SurveyWizardPage.tsx` | Orchestrates section/field index, save, Incomplete, Review |
| `src/features/surveys/components/fields/inputs.tsx` | Touch/spacing polish for RadioCards etc. (minimal) |
| `src/features/surveys/components/SurveyWizardPage.test.tsx` | Update + add one-question / leave-section PUT tests |
| `src/shared/i18n/en.ts` / `ar.ts` | Interview copy keys |
| `src/features/surveys/index.ts` | Export new public pieces only if needed |

---

### Task 1: Interview navigation helpers (TDD)

**Files:**
- Create: `src/features/surveys/utils/interview-nav.ts`
- Create: `src/features/surveys/utils/interview-nav.test.ts`
- Modify: `src/features/surveys/index.ts` (optional export of helpers — prefer keep internal)

**Interfaces:**
- Consumes: `FieldSpec`, `SectionSpec`, `FieldType` from `../schema`; `isFieldValid` from `./answers`
- Produces:
  - `SIMPLE_FIELD_TYPES: ReadonlySet<FieldType>`
  - `isSimpleField(field: FieldSpec): boolean`
  - `sectionUsesFieldWalk(section: SectionSpec): boolean` — true if every non-photo field is simple OR section is mixed with ≥1 simple (basicInfo walks field-by-field including photo as a step)
  - `walkableFields(section: SectionSpec): FieldSpec[]` — fields in order; include `photo` as a walkable step; for all-complex sections return `[]` (section mode)
  - `isSectionMode(section: SectionSpec): boolean` — `walkableFields(section).length === 0` OR section has any likert/matrix/checklist/signature and no simple fields (axes); **rule:** if `walkableFields` is empty → section mode; if non-empty → field walk. For axis sections with only likert → empty walkables → section mode. For basicInfo → all fields including photo in walk.
  - Actually simpler rule from spec:
    - Field is **simple** if type ∈ `{enum, multi, yesNo, string, text, email, phone, int, date}`
    - Field is **complex** if type ∈ `{likert, matrix3x3, matrix2x5, matrixDynamic, matrix3col, checklist, signature}`
    - Field is **media** if type === `photo` (treated as one walk step like simple)
    - `isSectionMode(section)` = every field is complex (no simple, no photo)
    - `walkableFields(section)` = all fields when not section mode; `[]` when section mode

- [ ] **Step 1: Write the failing test**

```ts
// src/features/surveys/utils/interview-nav.test.ts
import { describe, expect, it } from "vitest";
import { CONSENT_SECTION, SECTIONS, WIZARD_STEPS } from "../schema";
import {
  isSectionMode,
  isSimpleField,
  walkableFields,
} from "./interview-nav";

describe("interview-nav", () => {
  it("treats consent enum as simple / field-walk", () => {
    expect(isSimpleField(CONSENT_SECTION.fields[0])).toBe(true);
    expect(isSectionMode(CONSENT_SECTION)).toBe(false);
    expect(walkableFields(CONSENT_SECTION)).toHaveLength(1);
  });

  it("walks basicInfo field-by-field including photo", () => {
    const basic = SECTIONS.find((s) => s.key === "basicInfo")!;
    expect(isSectionMode(basic)).toBe(false);
    expect(walkableFields(basic).some((f) => f.type === "photo")).toBe(true);
    expect(walkableFields(basic).length).toBe(basic.fields.length);
  });

  it("uses section mode for likert-only axes", () => {
    const axis = WIZARD_STEPS.find((s) => s.key === "orgManagement")!;
    expect(isSectionMode(axis)).toBe(true);
    expect(walkableFields(axis)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/surveys/utils/interview-nav.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/surveys/utils/interview-nav.ts
import type { FieldSpec, FieldType, SectionSpec } from "../schema";

const SIMPLE: ReadonlySet<FieldType> = new Set([
  "enum", "multi", "yesNo", "string", "text", "email", "phone", "int", "date",
]);

const COMPLEX: ReadonlySet<FieldType> = new Set([
  "likert", "matrix3x3", "matrix2x5", "matrixDynamic", "matrix3col", "checklist", "signature",
]);

export function isSimpleField(field: FieldSpec): boolean {
  return SIMPLE.has(field.type);
}

export function isComplexField(field: FieldSpec): boolean {
  return COMPLEX.has(field.type);
}

/** Section mode = only complex fields (axes / checklist / signature blocks). */
export function isSectionMode(section: SectionSpec): boolean {
  return section.fields.length > 0 && section.fields.every(isComplexField);
}

/** Fields shown one-at-a-time; empty when section mode. */
export function walkableFields(section: SectionSpec): FieldSpec[] {
  if (isSectionMode(section)) {
    return [];
  }
  return [...section.fields];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/surveys/utils/interview-nav.test.ts`

Expected: PASS

- [ ] **Step 5: Commit** — skip unless user asks

---

### Task 2: `InterviewShell` presentational component

**Files:**
- Create: `src/features/surveys/components/InterviewShell.tsx`
- Create: `src/features/surveys/components/InterviewShell.test.tsx`
- Modify: `src/shared/i18n/en.ts`, `src/shared/i18n/ar.ts` (keys used by shell)

**Interfaces:**
- Consumes: `useT`, `SurveyStatusBadge`, `cn`
- Produces:

```tsx
export type InterviewShellProps = {
  workshopCode: string;
  status: SurveyStatus;
  title: string;           // section name or Review
  progressLabel: string;   // "Section 2 of 13" / "Question 3 of 12"
  progressPercent: number; // 0–100
  footerStart?: React.ReactNode; // Back
  footerEnd?: React.ReactNode;   // Next / Submit
  children: React.ReactNode;     // stage + optional Incomplete panel above
};
```

- [ ] **Step 1: Add i18n keys** (en + ar)

```ts
"survey.interview.questionOf": "Question {current} of {total}",
"survey.interview.howToFill": "Mark one answer per row",
"survey.interview.howToFillChecklist": "Choose a state for each item",
```

(Arabic equivalents in `ar.ts`.)

- [ ] **Step 2: Write a smoke test**

```tsx
it("renders workshop code, progress, and footer actions", () => {
  render(
    <I18nProvider>
      <InterviewShell
        workshopCode="RAC-CAR-000009"
        status="Draft"
        title="…"
        progressLabel="…"
        progressPercent={25}
        footerStart={<button type="button">Back</button>}
        footerEnd={<button type="button">Next</button>}
      >
        <p>Stage</p>
      </InterviewShell>
    </I18nProvider>
  );
  expect(screen.getByText("RAC-CAR-000009")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
});
```

- [ ] **Step 3: Implement shell**

Layout requirements from spec:
- Sticky top context: navy code chip + `SurveyStatusBadge` + title + `progressLabel`
- Progress bar (`role="progressbar"`)
- Main: `children`
- Sticky bottom footer: `justify-between`, safe-area padding, primary Next on the end side (`ms-auto` / flex)

Use tokens: `bg-background/95 backdrop-blur`, `text-[var(--navy)]`, `bg-primary` progress fill. No dots as primary nav (optional omit dots entirely).

- [ ] **Step 4: Run test**

Run: `npx vitest run src/features/surveys/components/InterviewShell.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit** — skip unless user asks

---

### Task 3: `QuestionStage` + `SectionStage`

**Files:**
- Create: `src/features/surveys/components/QuestionStage.tsx`
- Create: `src/features/surveys/components/SectionStage.tsx`

**Interfaces:**
- Consumes: existing `FieldRenderer` / `ComplexFieldRenderer` / `PhotoUploader`
- Produces:

```tsx
// QuestionStage — one field
export function QuestionStage({
  section, field, answers, onChange, error,
}: {
  section: SectionSpec;
  field: FieldSpec;
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  error?: string;
}): JSX.Element;

// SectionStage — all complex fields for a section
export function SectionStage({
  section, answers, onChange, stepErrors, howToFill,
}: {
  section: SectionSpec;
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  stepErrors: string[];
  howToFill: string;
}): JSX.Element;
```

- [ ] **Step 1: Implement `QuestionStage`**

- Large label via existing field label keys (`fieldLabelKey`)
- Render `FieldRenderer` or `PhotoUploader` when `field.type === "photo"` (needs `surveyId` prop — pass through)
- Error: `role="alert"` text-destructive under control
- Min tap: rely on updated RadioCards padding in Task 5 if needed; stage uses `gap-6 py-2`

- [ ] **Step 2: Implement `SectionStage`**

- Title already in shell; show `howToFill` as `text-sm text-muted-foreground`
- Wrapper: `overflow-x-auto` + `min-w-0`; inner table stickiness left to existing table components
- Map `section.fields` through `ComplexFieldRenderer`

- [ ] **Step 3: Smoke-test SectionStage with orgManagement** (optional lightweight render test)

- [ ] **Step 4: Commit** — skip unless user asks

---

### Task 4: Rewrite `SurveyWizardPage` orchestration

**Files:**
- Modify: `src/features/surveys/components/SurveyWizardPage.tsx`
- Modify: `src/features/surveys/components/SurveyWizardPage.test.tsx`

**Interfaces:**
- Consumes: Task 1–3 helpers/components; existing hooks; `ValidationPanel`
- Produces: same `SurveyWizardPage({ workshopId })` export

**State additions:**
```ts
const [fieldIndex, setFieldIndex] = useState(0);
// Reset fieldIndex to 0 whenever `step` (section index) changes
```

**Navigation logic (replace `goNext` / `goBack`):**

```ts
function goNext() {
  if (step === REVIEW_STEP) return;
  const section = WIZARD_STEPS[step];
  if (!section) return;

  if (isSectionMode(section)) {
    if (!validateSection(section)) { toast.warning(t("survey.stepIncomplete")); return; }
    putSectionAndAdvance(section);
    return;
  }

  const fields = walkableFields(section);
  const field = fields[fieldIndex];
  if (!field) return;

  // photo: no client isFieldValid gate (existing); still allow advance
  if (field.type !== "photo" && field.required && !isFieldValid(field, answers[section.key]?.[field.key])) {
    setStepErrors([field.key]);
    toast.warning(t("survey.stepIncomplete"));
    return;
  }
  setStepErrors([]);

  if (fieldIndex < fields.length - 1) {
    setFieldIndex((i) => i + 1);
    return;
  }
  // leaving section
  putSectionAndAdvance(section);
}

function putSectionAndAdvance(section: SectionSpec) {
  const payload = buildSectionPayload(section, answers[section.key] ?? {});
  saveSection.mutate(
    { key: section.key, data: payload },
    {
      onSuccess: () => {
        toast.success(t("survey.sectionSaved"));
        setFieldIndex(0);
        setStep((s) => Math.min(s + 1, REVIEW_STEP));
      },
      // keep existing 409 / error handling
    }
  );
}

function goBack() {
  setStepErrors([]);
  if (step === REVIEW_STEP) {
    setStep(WIZARD_STEPS.length - 1);
    setFieldIndex(0);
    return;
  }
  const section = WIZARD_STEPS[step];
  if (section && !isSectionMode(section) && fieldIndex > 0) {
    setFieldIndex((i) => i - 1);
    return;
  }
  if (step === 0) return;
  const prev = step - 1;
  const prevSection = WIZARD_STEPS[prev];
  setStep(prev);
  setFieldIndex(
    prevSection && !isSectionMode(prevSection)
      ? Math.max(0, walkableFields(prevSection).length - 1)
      : 0
  );
}
```

**Render:**
- Loading / error / no-survey gates unchanged
- Else wrap content in `InterviewShell`
- Incomplete panel as first child inside shell
- If Review → existing review list UI inside stage (text Done/Needs work)
- Else if section mode → `SectionStage` (+ GPS/photos blocks when `closing` — keep current closing extras after fields)
- Else → `QuestionStage` for `walkableFields(section)[fieldIndex]`
- Footer Back / Next / Submit wired as today
- Consent `no` → keep shortcut to Review; disable Next when consent null

**Progress:**
- Section progress: `(doneCount / WIZARD_STEPS.length) * 100` (existing)
- Label: section mode / review → `survey.stepOf` / `survey.stepReview`; field walk → `survey.interview.questionOf`

**Incomplete jump:**
```ts
onJumpToStep={(target) => {
  setSubmitResult(null);
  setStep(target);
  setFieldIndex(0);
}}
```

- [ ] **Step 1: Update failing expectations in existing tests**

Consent is one field → first Next still PUTs consent (same as today).  
basicInfo: first Next after entering section validates **first walkable field** only (projectCode optional → may advance without error). Adjust the “blocks advancing” test:

```ts
it("blocks advancing when a required simple field is empty", async () => {
  // consent yes → land on basicInfo field 0 (projectCode, optional)
  // advance until workshopName (required) shows, then Next empty → error, no extra PUT
});
```

Or jump fieldIndex by clicking Next through optional projectCode first.

- [ ] **Step 2: Add test — field walk does not PUT until last field**

```ts
it("does not PUT basicInfo until the last field is advanced", async () => {
  // consent save once; enter basicInfo; answer first required path carefully;
  // after one Next inside basicInfo, saveSection call count for key basicInfo is 0
});
```

- [ ] **Step 3: Implement orchestration in SurveyWizardPage**

- [ ] **Step 4: Run wizard tests**

Run: `npx vitest run src/features/surveys/components/SurveyWizardPage.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit** — skip unless user asks

---

### Task 5: Touch polish on simple controls + complex scroll

**Files:**
- Modify: `src/features/surveys/components/fields/inputs.tsx` (RadioCards, YesNoToggle, CheckGroup min heights / padding)
- Modify: complex table wrappers if needed for `sticky` first column — only if missing

- [ ] **Step 1: Increase RadioCards / YesNo hit area** to ≥ `min-h-11` / comfortable padding; keep existing APIs
- [ ] **Step 2: Ensure likert/checklist tables sit in `overflow-x-auto`** (SectionStage already wraps)
- [ ] **Step 3: Run** `npx vitest run src/features/surveys/components/fields/inputs.test.tsx`  
  Expected: PASS

---

### Task 6: Closing extras + Review inside shell

**Files:**
- Modify: `src/features/surveys/components/SurveyWizardPage.tsx` only

- [ ] **Step 1:** When section is `closing` and section mode is false (closing has signature/date etc. — check schema): if mixed, field-walk includes signatures; GPS block: show when current field is the last walkable **or** always show GPS on a dedicated pseudo-step after last field before PUT — **spec:** GPS lives in stage on Closing. Preferred: after last walkable field, one extra local step `gps` before PUT (not in schema). Keep simpler: while on closing section mode or after signatures, show GPS+docs photos in `SectionStage` footer area when `fieldIndex === last` OR if closing is section-mode.

Check closing fields in schema during implementation; if mostly signature/date → field walk; render GPS+PhotoUploader below QuestionStage when `section.key === "closing" && fieldIndex === walkableFields.length - 1` OR always at end of section before PUT.

- [ ] **Step 2:** Review step uses InterviewShell with Submit in footer; Incomplete panel still above
- [ ] **Step 3:** Manual sanity — not automated: Complete / Incomplete paths unchanged

---

### Task 7: Verify

- [ ] **Step 1:** `npx vitest run src/features/surveys`
- [ ] **Step 2:** `npx tsc --noEmit`
- [ ] **Step 3:** Manual checklist from spec §10 (phone viewport, likert scroll, RTL, Incomplete jump)

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Interview shell structure | 2, 4 |
| Simple one-at-a-time | 1, 3, 4 |
| Likert/matrix full section | 1, 3, 4 |
| Sticky footer Back/Next | 2, 4 |
| PUT on leave section only | 4 |
| Section saved toast | 4 |
| GPS/photos in stage | 6 |
| Incomplete above stage + jump | 4 |
| Review Done/Needs work | 4 (keep existing copy) |
| Queue unchanged | — (no task) |
| No schema/API change | Global |

## Placeholder / consistency review

- Helpers named `isSectionMode` / `walkableFields` consistently across tasks
- `SurveyStatus` includes `Incomplete` (already in types)
- Closing GPS edge case called out in Task 6 for implementer judgment against live schema

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-19-survey-questionnaire-interview-shell.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints  

Which approach?
