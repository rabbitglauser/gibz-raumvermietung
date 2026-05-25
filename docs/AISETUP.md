# AI Setup

All AI-related tooling in this project — what's installed, what each piece does, what credentials it needs, and how to use it day to day.

## Table of contents

1. [Overview](#overview)
2. [Per-project instructions (Claude / Codex / Cursor)](#per-project-instructions)
3. [Claude Code skills](#claude-code-skills)
4. [Sisyphus — plans + evidence workflow](#sisyphus)
5. [AI in GitHub Actions](#ai-in-github-actions)
6. [Required secrets & credentials](#required-secrets)
7. [Daily-use recipes](#daily-use-recipes)
8. [Where things live (quick map)](#where-things-live)

---

## Overview

This repo is wired for AI-assisted development in three layers:

| Layer | Purpose | Lives in |
|---|---|---|
| **Local AI guidance** | Tell Claude/Codex how this codebase is structured and what conventions to follow when editing it | `CLAUDE.md`, `AGENTS.md`, `docs/CLAUDE.md` |
| **Claude Code skills** | Project-specific "macros" — when you say a phrase, Claude follows a documented procedure (add a room, write a reservation test, run sisyphus, etc.) | `.claude/skills/` |
| **GitHub Actions AI** | AI runs inside CI: review PRs, manage the Project board, answer `/oc` comments on issues | `.github/workflows/`, `.github/scripts/` |

Each layer is independent — you can use the skills locally without the GitHub Actions piece, and the GitHub Actions piece works whether or not anyone is running Claude Code locally.

---

## Per-project instructions

Three files tell different AI tools how to work with this codebase. Edit these when conventions change — the AI reads them every time.

- **`CLAUDE.md`** — loaded by Claude Code on every session. Contains layout, commands, architecture notes (especially the `ROOM_RULES` invariant, the adjacent-booking rule, and the in-memory mock collection convention).
- **`AGENTS.md`** — same content but for Codex / generic agents. Keep in sync with `CLAUDE.md`.
- **`docs/CLAUDE.md`** — onboarding doc for humans about which Claude plugins/skills are installed on this machine.

> If you change a convention, update **both** `CLAUDE.md` and `AGENTS.md`. They drift easily.

---

## Claude Code skills

A skill is a markdown file at `.claude/skills/<name>/SKILL.md`. When a user phrase matches the skill's `description`, Claude follows the steps in that file. List of installed skills:

| Skill | Trigger phrase examples | What it does |
|---|---|---|
| `add-room` | "add a new room", "add seminarraum X" | Walks through editing `RoomId`, `ROOM_RULES`, and tests — keeps room logic centralized |
| `add-frontend-component` | "create a new component", "new atom/molecule/organism" | Picks the correct atomic-design tier under `frontend/src/components/` |
| `add-reservation-validator` | "add a cross-field rule" | Places business rules on the pydantic model (422 contract) instead of the route handler |
| `extend-mock-query` | "add a `$in` operator", "support `$regex` in tests" | Updates the hand-rolled in-memory mock collection in lockstep with new MongoDB operators |
| `iso-time-strings` | "compare times", "store dates" | Reinforces the zero-padded ISO string convention that the conflict detection depends on |
| `write-reservation-test` | "write a test for reservations" | Uses `MockReservationsCollection`, respects the adjacent-booking regression invariant |
| `sisyphus` | "start a sisyphus plan", "verify task N", "sisyphus status" | Drives the plans + evidence workflow (see next section) |

You can also call any of these explicitly as a slash command in Claude Code: `/add-room`, `/sisyphus`, etc.

### Editing a skill

Open `.claude/skills/<name>/SKILL.md`. The frontmatter `name` and `description` control triggering; the markdown body is what Claude reads when the skill fires. Keep the body short and concrete — a skill that's too long stops getting followed.

### Adding a skill

Easiest path: run `/skill-creator` and describe what you want. Manually: copy any existing skill's structure, change the frontmatter, write the procedure.

---

## Sisyphus

Sisyphus is **not a tool to install** — it's a local convention with two folders and a discipline:

```
.sisyphus/
├── README.md                                  # the spec
├── plans/
│   └── <plan-name>.md                          # numbered tasks
└── evidence/
    └── task-<NN>-<slug>.txt                    # proof per task
```

A task is "done" only when its evidence file (showing the command + actual output + PASS/FAIL/INTENTIONAL) is committed. Reviewers can grep `.sisyphus/evidence/` to see what was actually verified.

The `/sisyphus` skill drives the workflow:

- "Start a sisyphus plan for X" → Claude asks for a slug, helps split work into verifiable tasks, writes the plan file
- "Verify task 2" → Claude runs the verification command and writes `task-2-*.txt` with the real output
- "Sisyphus status" → ✅/⬜ per-task summary across all open plans
- "Wrap up the sisyphus plan" → Status check + commit

See `.sisyphus/README.md` for the full convention and `.sisyphus/plans/EXAMPLE-reservation-overlap.md` for a worked example using this project's reservation-conflict invariant.

---

## AI in GitHub Actions

Four workflows under `.github/workflows/` use AI APIs.

### `opencode.yml` — `/oc` PR comments

Trigger any PR/issue comment that starts with `/oc` or `/opencode`. The [opencode](https://opencode.ai) GitHub action runs against the comment and replies.

- **Secret needed:** `OPENAI_API_KEY`
- **Model:** `openai/gpt-5` (configurable in the workflow)

### `ai-project-manager.yml` — autonomous PR/issue triage

Fires on PR events, issue events, PR reviews, issue comments, and check_suite completions. Hands the full PR/issue context to GPT-4o, which decides what actions to take (move project status, set priority/size, label, comment, approve, even merge if it judges the change safe).

- **Secrets needed:** `OPENAI_API_KEY` + `PROJECT_TOKEN` (fine-grained PAT with `Projects: Read/write` + `Contents/Issues/PRs: Read/write`)
- **Script:** `.github/scripts/ai-project-manager.js`
- **Status:** Has `REPLACE_ME_*` placeholders for Project V2 node IDs. Run `scripts/fetch-project-ids.ps1` to grab the real IDs and paste them into the `env:` block. The JS file also has inline ID constants that still need replacing — see `docs/github-setup.md` §5 for the full procedure.
- **Bot identity:** Posts comments as `**Bütel AI**` (legacy string from the Butel project — change in the JS if you rebrand).

### `issue-management.yml` — AI labeling on issues

Adds new issues to the Project board, then asks GPT-4o-mini to suggest labels/priority.

- **Secrets needed:** `OPENAI_API_KEY` + `PROJECT_TOKEN`
- **Hardcoded Project IDs:** same `REPLACE_ME_*` situation as above.

### `pr-automation.yml` — PR ↔ linked-issue sync

When a PR is opened/closed/merged, walks its body for `Closes #N` / `Fixes #N` references and updates the linked issues' Project status accordingly. No AI calls — just GraphQL automation, but lives in the same family.

- **Secrets needed:** `PROJECT_TOKEN`
- **Hardcoded Project IDs:** same `REPLACE_ME_*` situation.

> Full setup checklist for all four: `docs/github-setup.md`.

---

## Required secrets

In **Settings → Secrets and variables → Actions** on the GitHub repo:

| Secret | Required by | How to get |
|---|---|---|
| `OPENAI_API_KEY` | opencode.yml, ai-project-manager.yml, issue-management.yml | <https://platform.openai.com/api-keys> |
| `PROJECT_TOKEN` | ai-project-manager.yml, issue-management.yml, pr-automation.yml | Fine-grained PAT: Settings → Developer settings → Personal access tokens → Fine-grained → `Projects: Read/write`, `Contents/Issues/PRs: Read/write` |

The default `GITHUB_TOKEN` is auto-provided but **cannot write to Projects V2** — that's why `PROJECT_TOKEN` exists separately.

Local Claude Code uses your machine's Claude subscription / API keys — nothing to configure per-repo.

---

## Daily-use recipes

### "Help me add a fourth room"

In Claude Code: *"add a new room called seminarraum 3.201"* → triggers the `add-room` skill. Edits the right enum + `ROOM_RULES`, writes tests, no ad-hoc handler checks.

### "I want a receipt that the conflict detection still works after my change"

*"Start a sisyphus plan for verifying conflict detection after refactor"* → `/sisyphus` skill writes the plan. Then *"verify task 1"* runs the relevant pytest and writes the evidence file. Commit it with the change.

### "Ask the PR for a review"

Comment `/oc review this PR` on any open PR. The `opencode.yml` workflow picks it up and replies. (`/oc` is the short form, `/opencode` works too.)

### "Move this issue across the board"

Comment `/status In Progress` (or `/priority p1`, `/size m`) on an issue. `ai-project-manager.yml` picks it up, GPT-4o parses the slash command, and the Project board updates.

### "Get a second pair of eyes on a hairy change"

In Claude Code: *"do a code review"* → runs the `code-review` skill on the current diff. For a deeper, multi-agent review, run `/ultrareview` (cloud-billed, separate flow).

---

## Where things live

```
.
├── CLAUDE.md                                   # per-session Claude guidance
├── AGENTS.md                                   # same for Codex
├── docs/
│   ├── AISETUP.md                              # this file
│   ├── CLAUDE.md                               # human onboarding for installed plugins
│   └── github-setup.md                         # secrets, Project IDs, labels — full GitHub config
├── .claude/
│   └── skills/                                 # 7 skills (add-room, sisyphus, etc.)
├── .sisyphus/                                  # plans + evidence audit trail
│   ├── README.md
│   ├── plans/
│   └── evidence/
├── .github/
│   ├── workflows/
│   │   ├── opencode.yml                        # /oc agent
│   │   ├── ai-project-manager.yml              # autonomous PR/issue triage
│   │   ├── issue-management.yml                # AI labeling
│   │   └── pr-automation.yml                   # PR ↔ issue sync
│   └── scripts/
│       └── ai-project-manager.js               # the GPT-4o orchestrator
└── scripts/
    ├── create-labels.ps1                       # idempotent label sync
    └── fetch-project-ids.ps1                   # one-shot GraphQL ID grab
```

When in doubt: start at `docs/github-setup.md` for CI/AI setup, `.sisyphus/README.md` for the audit-trail convention, and `CLAUDE.md` for how the AI should treat the code itself.
