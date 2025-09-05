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
PR titles must satisfy **both**:

1. **Conventional Commits format**  
   ```
   type(scope?): short description
   ```
   Examples:  
   - `feat: add onboarding wizard`  
   - `fix(auth): handle token refresh`  

   Allowed types:  
   `feat | fix | chore | docs | refactor | test | perf | build | ci | revert`

2. **Jira Issue Key (FSR-###)**  
   Required when:  
   - The PR is from a `feature/*` or `hotfix/*` branch  
   - And targets the `development` branch  

   Example:  
   ```
   feat(auth): handle token refresh [FSR-123]
   ```

 PRs that don’t meet these rules will **fail CI checks** until corrected.

---

## Release Process

1. Run the **"Create Release Branch"** workflow in **Actions**  
   - Input version (e.g. `1.4.0`)  
   - Creates `release/1.4.0` from `development`  

2. Commit any fixes to the `release/1.4.0` branch  

3. The **Release Automation** workflow will:  
   - Open PRs:  
     - `release/1.4.0` → `master`  
     - `release/1.4.0` → `development` (back-merge)  
   - Enable **auto-merge** once checks pass  
   - Tag `v1.4.0` on `master` and create a GitHub Release  

---

## 🛠 Hotfix Process

1. Branch from `master`:  
   ```bash
   git checkout -b hotfix/1.4.1-login-crash master
   ```  
2. Open PR → `master`  
3. After merge, back-merge into `development` (handled manually or via automation)

---
