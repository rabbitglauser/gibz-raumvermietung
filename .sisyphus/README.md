# Sisyphus — plans + evidence workflow

> Sisyphus is a project-local convention, **not** a tool to install. Two folders, a naming rule, and a discipline: every claim of "done" needs a committed evidence file behind it.

## Layout

```
.sisyphus/
├── README.md
├── plans/
│   └── <plan-name>.md
└── evidence/
    └── task-<NN>-<slug>.txt
```

## How a plan works

A plan lives at `.sisyphus/plans/<plan-name>.md`. Examples of good plan names:

- `pr-42-review-fixes.md`
- `incident-2026-05-25-conflict-detection.md`
- `migrate-mongo-index.md`

A plan is a numbered list of tasks. Each task should be **independently verifiable** — i.e., it should be obvious what command or check proves it's done.

Tags you can put after a task title:

| Tag | Meaning |
|---|---|
| `CONFIRMED` | Reviewer-confirmed real bug; fix it. |
| `INTENTIONAL` | Behavior is by design; lock it in with a test instead of "fixing" it. |
| `DEFERRED` | Out of scope for this plan; tracked elsewhere. |
| `WONTFIX` | Decision: not addressing this. |

### Plan template

```markdown
# Plan: <one-line goal>

## Context
Why this work matters — what triggered it, what success looks like.

## Tasks

### 1. <short title>
<one-paragraph description; what needs to happen; how it'll be verified>

### 2. <short title> — INTENTIONAL
<why this is locked in by design, what test pins the behavior>

### 3. <short title>
<...>
```

## How evidence works

For each numbered task in the plan, drop one **or more** evidence files in `.sisyphus/evidence/`. Naming:

```
task-<task-number>-<short-slug>.txt
```

A task that needs several checks (positive case, negative case, edge case) gets several evidence files all prefixed with the same task number — e.g.:

```
task-3-positive.txt
task-3-bad-input.txt
task-3-edge-overflow.txt
```

### Evidence template

```text
Task <NN> — <task title from the plan>

CONTEXT:
  <one-sentence pointer to the plan and what specifically is being verified>

COMMAND:
  <exact shell command, copy-pasteable>

RESULT:
  <paste of stdout/stderr — trimmed to what's relevant, keep the assertion/exit line>

STATUS: PASS | FAIL | INTENTIONAL
  <one-line conclusion. PASS means the command shows the expected behavior. INTENTIONAL means a test was added that locks in by-design behavior.>
```

Keep evidence files as `.txt` (not `.md`) — they're plain proof, not formatted prose.

## Discipline

- **A task is "done" only when its evidence file is committed.** No evidence ⇒ no green check.
- **Plans live forever in git history.** Don't rewrite a closed plan; open a new one if scope grows.
- **Evidence may get stale.** If you rerun verification later and the result has changed, add a *new* evidence file (`task-3-positive-2026-07.txt`) rather than editing the old one — preserves the audit trail.

## Example

See `.sisyphus/plans/EXAMPLE-reservation-overlap.md` and the matching `.sisyphus/evidence/task-1-adjacent-booking-allowed.txt` for a fully worked example using this project's reservation-conflict logic.
