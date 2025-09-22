# GitFlow Branching & CI/CD Workflows

This repository follows a **GitFlow workflow** with automated checks and release management powered by **GitHub Actions**.  

---

## Branch Model

- **`master`** → always production-ready  
- **`development`** → integration branch for next release  
- **`feature/*`** → new features (branched from `development`)  
- **`release/*`** → release preparation branches (branched from `development`)  
- **`hotfix/*`** → urgent production fixes (branched from `master`)  

---

## Pull Request Rules

Our GitHub Actions enforce PR validation:

### Base Branch Rules
- `feature/*` → must target `development`  
- `hotfix/*` → must target `master`  
- `release/*` → must target `master` and/or `development` (automation handles both)

### PR Title Rules
PR titles must be formatted as:

```
FSR-<ticket number> | <short description>
```

Examples:
- `FSR-1436 | GOV UK rebrand to 5.10`
- `FSR-1520 | Fix login session expiry issue`

 PRs that don’t meet these rules will **fail CI checks** until corrected.

---

## Release Process

Can be found in the [Release Workflow documentation](./release-workflow.md)

---

## Hotfix Process

1. Branch from `master`:  
   ```bash
   git checkout -b hotfix/1.4.1-login-crash master
   ```  
2. Open PR → `master`  
3. After merge, back-merge into `development` (handled manually or via automation)

---
