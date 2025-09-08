# 🚀 Create Release Branch and Draft PRs (Workflow Guide)

This document explains how the **Create Release Branch and Pull Requests** workflow works and how to run it safely.  
File: `.github/workflows/release.yml`  
Goal: **Cut a `release/x.y.z` branch from `development`, bump the version, push it, generate release notes (optional), and open _draft_ PRs to `master` and `development`.**

> This workflow **does not auto-merge**. It only prepares the release and opens draft PRs for review/approval.

---

## Triggers

- **Manual only** via **Actions → Create Release Branch and Pull Requests → Run workflow** (`workflow_dispatch`).

### Inputs
- `jira_release_id` – ID from your Jira release URL (used in notes).
- `proposed_release_date` – `dd/mm/yyyy` (passed to notes generator).
- `db_changes` – Boolean flag for whether this release includes DB changes.
- `increment` – One of `major | minor | patch`. Used to bump the `package.json` version.

---

## Required Secrets & Permissions

- `GH_WORKFLOW` – **Classic PAT (repo scope)** for GitHub CLI (`gh`) to create PRs and trigger downstream workflows.
- App/runtime secrets (`FLOOD_APP_*`) – used when committing generated notes.
- Repo settings:  
  - Actions → General → Workflow permissions → **Read and write**  
  - (Recommended) Allow GitHub Actions to create and approve PRs  

---

## Step-by-step

1. **Echo Inputs** – prints inputs for traceability.  
2. **Validate PAT** – confirms `GH_WORKFLOW` has access.  
3. **Checkout `development`** – ensures a full history.  
4. **Setup Node & Install Dependencies** – via `.nvmrc` and `npm ci`.  
5. **Bump Version** – runs `npm version`, sets `VERSION` + `RELEASE_BRANCH`.  
6. **Check branch doesn’t exist** – fails early if `release/x.y.z` exists.  
7. **Create Release Branch** – commits the bump.  
8. **Optional Release Notes** – if `release-docs/template.njk` exists.  
9. **Push Branch** – to origin.  
10. **Open Draft PRs** – one into `master`, one into `development`.  
11. **Trigger Downstream Workflow** – runs `release.yml` in `flood-service`.  
12. **Cleanup** – deletes release branch if workflow fails.  

---

## How to Run

1. Go to **Actions → Create Release Branch and Pull Requests → Run workflow**.  
2. Provide inputs (`increment`, `jira_release_id`, `proposed_release_date`, `db_changes`).  
3. Run workflow.  
4. After completion, check:  
   - `release/x.y.z` branch exists  
   - Draft PRs into `master` and `development` are created  
   - Release notes committed (if template exists)  

---

## What You Get

- A `release/x.y.z` branch from `development`  
- Version bump committed  
- Optional release notes file in `release-docs/`  
- Draft PRs into `master` and `development`  
- (Optional) Downstream workflow triggered  

---

## Troubleshooting

- **Branch already exists** – pick a new increment or delete old branch.  
- **Auth failed** – recreate classic PAT and set `GH_WORKFLOW`.  
- **`npm ci` fails** – check `.nvmrc`, engines, lockfile.  
- **No notes generated** – ensure `release-docs/template.njk` exists.  
- **Downstream workflow didn’t trigger** – check PAT scope and target file name.  

---

## Governance

- Keep `master` & `development` protected.  
- Draft PRs prevent accidental merges until marked “Ready for review.”  
- Rotate PATs regularly.  

---

## Checklist for Release Manager

- [ ] Run workflow with correct inputs  
- [ ] Verify branch + notes exist  
- [ ] Review draft PRs  
- [ ] Merge into `master`  
- [ ] Merge back into `development`  
- [ ] Tag/publish release (if not automated)  

---
