# Claude Tooling

This document tracks the Claude Code plugins and skills installed for this project, what they do, and why we use them. It is for humans onboarding to the workflow — not loaded as project instructions.

## Installation

Run these once per machine. Slash commands are entered inside a Claude Code session; the `npx` line runs in a regular shell.

```text
/plugin install skill-creator@claude-plugins-official
/plugin install superpowers@claude-plugins-official
/plugin install frontend-design@claude-plugins-official

/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode

/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

```bash
npx get-shit-done-cc --claude --global
```

## What each one does

| Plugin / tool                                    | Source                          | Purpose                                                                 |
| ------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------- |
| `skill-creator`                                  | `claude-plugins-official`       | Scaffold new skills (the `/<name>` commands Claude can invoke).         |
| `superpowers`                                    | `claude-plugins-official`       | Bundle of higher-level workflow skills.                                 |
| `frontend-design`                                | `claude-plugins-official`       | UI/UX-focused skills — useful when iterating on the Next.js frontend.  |
| `context-mode`                                   | `mksglu/context-mode`           | Switch Claude between context profiles for different tasks.             |
| `claude-mem`                                     | `thedotmack/claude-mem`         | Persistent memory across sessions.                                      |
| `get-shit-done-cc`                               | `npx` global install            | Productivity helper installed globally (`--global`), not per-project.   |

## Notes

- `--global` on the `npx` line means it is shared across all repos on this machine. Don't reinstall per project.
- Marketplace plugins (`context-mode`, `claude-mem`) require the `marketplace add` step *before* `plugin install`.
- This file is documentation only. Project-level guidance for Claude lives in the repo-root `CLAUDE.md`.
