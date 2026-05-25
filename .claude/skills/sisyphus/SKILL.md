---
name: sisyphus
description: Use when the user wants to start, continue, or verify a Sisyphus-style plans+evidence audit trail. Drives the `.sisyphus/plans/` and `.sisyphus/evidence/` workflow — each numbered task in a plan must have a matching evidence file showing the verification command + output. Triggered by phrases like "start a sisyphus plan", "new plan for X", "verify task N", "add evidence", "sisyphus status".
---

# Sisyphus — drive the plans + evidence workflow

## When to use

Trigger on any of these intents:

- **Start a new plan:** "let's start a sisyphus plan for X", "new plan for PR #N", "track this with sisyphus"
- **Add a task to an open plan:** "add task to the sisyphus plan", "new task: <description>"
- **Verify a task and record evidence:** "verify task N", "evidence for task N", "run task N verification"
- **Check status:** "sisyphus status", "what's left in the plan", "which tasks are missing evidence"
- **Close out a plan:** "wrap up the sisyphus plan"

Do **not** auto-trigger on every multi-step task. Only when the user explicitly signals they want this audit trail (or when they're about to claim "done" on work where having receipts matters — security work, PR review, incident post-mortem).

## Ground rules

- `.sisyphus/README.md` is the canonical spec for the convention. Re-read it if unsure.
- Plans live at `.sisyphus/plans/<name>.md`. Evidence lives at `.sisyphus/evidence/task-<NN>-<slug>.txt`.
- Evidence files are **`.txt`**, not `.md`. They're raw proof, not prose.
- A task is "done" only when its evidence file is committed. Never claim a task done without writing the matching evidence.
- One evidence file per check. A task that needs multiple checks (positive, negative, edge) gets multiple files, all sharing the same `task-<NN>-` prefix.

## Operations

### 1. Start a new plan

1. Ask the user for: (a) the plan name (slug, e.g. `pr-42-review-fixes`, `incident-2026-05-25`), (b) one-line description of the goal.
2. Help them split the work into **independently verifiable** tasks. Each task should answer the question "what command or check would prove this is done?" If a task has no verification, push back — either split it or remove it.
3. Write `.sisyphus/plans/<slug>.md` using this template:

```markdown
# Plan: <one-line goal>

## Context
<2-4 sentences: why this work matters, what triggered it, what success looks like>

## Tasks

### 1. <short task title>
<one paragraph: what needs to happen + how it will be verified>
Evidence: `task-1-<short-slug>.txt`

### 2. <short task title> — INTENTIONAL
<for behavior that is by design and needs a guardrail test instead of a fix>
Evidence: `task-2-<short-slug>.txt`

### 3. <short task title>
<...>
Evidence: `task-3-<short-slug>.txt`
```

4. Don't commit yet. Tell the user the plan is drafted and ask whether they want to start verifying tasks immediately or save it for later.

### 2. Verify a task and record evidence

1. Read the plan file. Find the task by number.
2. Determine the verification approach: usually a pytest invocation, a grep, a curl, or a manual inspection. The task description in the plan should hint at it. If unclear, ask the user.
3. Run the command. Capture the **actual output** — exit code, relevant stdout/stderr, the assertion lines that matter. Don't paraphrase.
4. Write `.sisyphus/evidence/task-<NN>-<slug>.txt` using this template:

```text
Task <NN> — <task title from the plan>

CONTEXT:
  Plan: .sisyphus/plans/<plan-name>.md
  <one-sentence pointer to what specifically is being verified>

COMMAND:
  <exact shell command, copy-pasteable>

RESULT:
  <relevant chunk of actual stdout/stderr — keep the assertion/exit line>

STATUS: PASS | FAIL | INTENTIONAL
  <one-line conclusion>
```

5. Use status `INTENTIONAL` when the evidence locks in by-design behavior via a guardrail test (e.g., a test named `INTENTIONAL: ...`). Use `FAIL` honestly if the verification didn't pass — don't paper over failures; tell the user.
6. If multiple checks are needed for one task, write `task-<NN>-<slug>-1.txt`, `task-<NN>-<slug>-2.txt`, etc., or use descriptive suffixes (`task-3-positive.txt`, `task-3-bad-input.txt`).

### 3. Check status

1. Glob `.sisyphus/plans/*.md` for plan files. For each:
   - Parse the numbered tasks (look for `### <N>.` headers).
   - Glob `.sisyphus/evidence/task-<N>-*.txt` for matching evidence.
   - Mark each task ✅ (≥1 evidence file exists) or ⬜ (none).
2. Print a compact summary per plan. Don't dump file contents unless asked.

Example output:
```
.sisyphus/plans/pr-42-review-fixes.md
  ✅ 1. SQL injection in /search
  ✅ 2. CSRF token rotation — INTENTIONAL
  ⬜ 3. Rate-limit on /login
  ⬜ 4. Audit log for admin actions

2/4 verified, 2 remaining
```

### 4. Close out a plan

1. Run "Check status". If anything is ⬜, ask the user whether to verify it now or mark it `DEFERRED` / `WONTFIX` in the plan.
2. Stage all evidence + the plan, commit with message `sisyphus: complete <plan-name>`. Use the standard project commit conventions.

## Why this matters

The whole point is that "done" needs receipts. Without the discipline, claims like "I fixed X" and "tests pass" rot — no future reader can tell what was actually verified. Sisyphus makes that audit trail a checked-in artifact: a reviewer can grep `.sisyphus/evidence/` and see exactly what commands were run for every claim.

The trap to avoid: writing the evidence file from imagination instead of running the command. Always actually run the verification. If the command fails, the evidence file says FAIL — that's still useful information, much more than a deleted or rewritten file.

## Reference

- Convention spec: `.sisyphus/README.md`
- Worked example: `.sisyphus/plans/EXAMPLE-reservation-overlap.md` + `.sisyphus/evidence/task-1-adjacent-booking-allowed.txt`
- Project verification commands: see `CLAUDE.md` "Commands" section (`pytest`, `npm run lint`, etc.)
