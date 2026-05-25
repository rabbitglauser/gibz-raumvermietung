# GitHub setup — what to configure for `.github/` workflows

This file is the checklist for getting the workflows in `.github/workflows/` to run. Do these in order.

## 1. Create the `dev` branch

Several workflows (`enforce-branch-policy.yml`, `sync-main-to-dev.yml`) target a `dev` branch.

```bash
git checkout -b dev
git push -u origin dev
git checkout main   # or wherever you were
```

## 2. Add repo secrets

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Used by | Why |
|---|---|---|
| `OPENAI_API_KEY` | `opencode.yml`, `ai-project-manager.yml`, `issue-management.yml` | AI labeling/review and `/oc` PR-comment agent. Get one from <https://platform.openai.com/api-keys>. |
| `PROJECT_TOKEN` | `ai-project-manager.yml`, `issue-management.yml`, `pr-automation.yml` | A fine-grained PAT — the auto-provided `GITHUB_TOKEN` cannot write to Projects V2. See step 4 below. |

## 3. Create a GitHub Project V2

You need a Project for `ai-project-manager`, `issue-management`, and `pr-automation` to write into.

1. Profile picture → **Your projects → New project → Board** (or Table).
2. Add a **Status** single-select field with options: `Backlog`, `Todo`, `In Progress`, `Testing`, `Done`.
3. Add a **Priority** single-select field with options: `P0`, `P1`, `P2`.
4. Add a **Size** single-select field with options: `XS`, `S`, `M`, `L`, `XL`.
5. Open the project, click **⋯ → Settings**, and link it to this repo under **Manage access**.

## 4. Create a fine-grained Personal Access Token (PROJECT_TOKEN)

**Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.

- **Resource owner:** your user (or the org if the repo is in an org).
- **Repository access:** Only select repositories → `gibz-raumvermietung`.
- **Repository permissions:** Contents (Read/Write), Issues (Read/Write), Pull requests (Read/Write), Metadata (Read).
- **Account permissions** (this is the critical one): **Projects → Read and write**.
- Copy the token, then paste it as the `PROJECT_TOKEN` secret from step 2.

## 5. Find the Project node IDs and paste them into the workflows

The three workflows (`ai-project-manager.yml`, `issue-management.yml`, `pr-automation.yml`) all have `REPLACE_ME_*` placeholders in their `env:` block. There's a helper script that fetches every ID in one call:

```powershell
$env:GH_TOKEN = '<your PROJECT_TOKEN PAT>'
pwsh ./scripts/fetch-project-ids.ps1 -ProjectNumber 4   # the int from your Project URL
# for an org project: -Owner my-org -IsOrg
```

> "GraphQL" here is just the protocol GitHub uses for its Projects V2 API. The script runs **one** GraphQL call against `api.github.com` — your FastAPI/Mongo stack is not involved.

The script prints a ready-to-paste `env:` block. Copy it over the `REPLACE_ME_*` block in `ai-project-manager.yml`. For `issue-management.yml` and `pr-automation.yml` copy the subset they need (issue-management drops the `SIZE_*` vars; pr-automation only uses `PROJECT_ID`, `STATUS_FIELD_ID`, and the `STATUS_*` options).

## 6. Workflow permissions

**Settings → Actions → General → Workflow permissions**:

- Select **Read and write permissions**.
- Tick **Allow GitHub Actions to create and approve pull requests** (needed for `sync-main-to-dev.yml` and `dependabot-automerge.yml`).

## 7. (Optional) GitHub Pages for the frontend

If you want `nextjs.yml` to actually deploy: **Settings → Pages → Source: GitHub Actions**.

## 8. Create the labels the labelers reference

`labeler.yml` and `pr-labeler.yml` apply labels — GitHub silently no-ops if the label doesn't exist yet. There's a one-shot script to create them all:

```powershell
$env:GH_TOKEN = '<your PAT with `repo` or fine-grained Issues:write>'
pwsh ./scripts/create-labels.ps1
```

It's idempotent — re-running just prints `exists` for labels already present. Labels created:

- Layer (green): `backend`, `frontend`
- Doc/infra (teal): `documentation`, `infrastructure`, `authentication`, `database design`, `ci/cd`
- Area (yellow): `area:reservations`, `area:tests`, `area:ui`, `area:pages`, `area:database`
- Size (gray): `size:XS`, `size:S`, `size:M`, `size:L`, `size:XL`

## Smoke test

After all of the above:

1. Push a tiny commit on a new branch, open a PR into `dev`.
2. Expect: `pr-checks.yml` runs (conventional-commit check), `pr-labeler.yml` adds a size label + area label, `ai-project-manager.yml` adds the PR to the Project board.
3. Comment `/oc explain this PR` on the PR → `opencode.yml` should reply.
4. Push a tag like `v0.0.1` → `release.yml` creates a draft release.

If any of these no-op silently, the most common cause is the `REPLACE_ME_*` placeholders weren't filled in, or `PROJECT_TOKEN` lacks `Projects: Read and write`.
