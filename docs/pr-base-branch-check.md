# PR Base Branch Check Workflow

This repository uses a GitHub Action to enforce **GitFlow base branch rules** for all pull requests.

---

## How It Works

The workflow is defined in `.github/workflows/pr-base-branch.yml`.  
It runs automatically when a pull request is **opened**, **edited**, **synchronized**, or **reopened**.

The job checks the **source branch** (head) and the **target branch** (base) against the allowed GitFlow rules.

---

## Allowed Branch Combinations

- **Into `master`**  
  - Only `release/*` or `hotfix/*` branches may target `master`  
  - Any other branch type → workflow fails

- **Into `development`**  
  - `feature/*` → allowed  
  - `release/*` (back-merge) → allowed  
  - `hotfix/*` (back-merge) → allowed  
  - Any other branch type → workflow fails

- **Into other branches**  
  - By default the workflow allows these but prints an informational message.  
  - You can make this a failure if you want to lock the repo down further.

---

## Why This Matters

This protects the repository by enforcing the GitFlow strategy:  

- Prevents developers from accidentally merging `feature/*` directly into `master`  
- Ensures hotfixes applied to `master` are also merged back into `development`  
- Keeps `master` stable and production-ready

---

## Example Output

```
PR: feature/add-login  →  development
Allowed: feature/add-login → development
Branches OK per policy.
```

If the rules are broken:

```
PR: feature/add-login  →  master
Only release/* or hotfix/* branches may target master.
Error: Process completed with exit code 1.
```

---

## Notes

- The workflow ignores PRs opened by `dependabot[bot]`.  
- Rules are based on `github.event.pull_request.base.ref` (e.g., `master`) and `github.event.pull_request.head.ref` (e.g., `feature/foo`).  
- Adjust the patterns (`feature/*`, `release/*`, `hotfix/*`) if your team uses different naming.

---
