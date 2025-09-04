# GitHub Actions Release and Hotfix Workflows

This document describes the release management and hotfix deployment workflows used in the flood-app repository.

## Overview

The flood-app uses GitHub Actions for:
-  **Release Management** - Automated release creation and merging
- 🔧 **Hotfix Management** - Emergency fix deployment process

## Workflows

### 1. Release Creation (`release.yml`)
**Triggers:** Manual workflow dispatch  
**Purpose:** Creates release branches and draft pull requests

**Input Parameters:**
- `jira_release_id`: Jira release ID from URL
- `proposed_release_date`: Release date (dd/mm/yyyy)
- `db_changes`: Whether release includes database changes
- `increment`: Version increment (major/minor only)
  - **major**: Breaking changes (1.0.0 → 2.0.0)
  - **minor**: New features, backwards compatible (1.0.0 → 1.1.0)

**What it does:**
1. Bumps version number
2. Creates release branch (`release/{version}`)
3. Generates release notes from template
4. Creates draft PRs to `master` and `development`
5. Triggers same process in flood-service repository

**Required Secrets:**
- `GH_WORKFLOW`: Personal access token with repo scope

### 2. Release Merge (`merge.yml`)
**Triggers:** Manual workflow dispatch  
**Purpose:** Merges approved release branches and creates GitHub releases

**Input Parameters:**
- `version`: Version number for release

**What it does:**
1. Checks release branch exists
2. Verifies PR approvals for both repositories (flood-app and flood-service)
3. Merges release branch to `master`
4. Creates GitHub release with tag
5. Merges release branch to `development`
6. Triggers merge in flood-service repository

### 3. Hotfix Creation (`hotfix.yml`)
**Triggers:** Manual workflow dispatch  
**Purpose:** Creates hotfix branches for emergency fixes

**Input Parameters:** None (automatically uses patch increment)

**What it does:**
1. Bumps version using patch increment (e.g., 1.0.0 → 1.0.1)
2. Creates hotfix branch (`hotfix/{version}`)
3. Creates PRs to both `master` and `development`
4. Cleans up branch if workflow fails

**Required Secrets:**
- `GH_WORKFLOW`: Personal access token with repo scope

### 4. Hotfix Merge (`merge-hotfix.yml`)
**Triggers:** Manual workflow dispatch  
**Purpose:** Merges approved hotfix branches for emergency fixes

**Input Parameters:**
- `version`: Hotfix version (e.g., 2.5.1)

**What it does:**
1. Checks hotfix branch exists (`hotfix/{version}`)
2. Verifies PR approvals for merging to both `master` and `development`
3. Merges hotfix to `master`
4. Creates GitHub release tag
5. Merges hotfix to `development`

## Release Process

### Standard Release
1. **Create Release Branch**
   ```
   Go to Actions → Release Creation → Run workflow
   - Enter Jira release ID
   - Set proposed release date
   - Select version increment
   - Indicate if DB changes included
   ```

2. **Review and Approve PRs**
   - Review generated PRs to `master` and `development`
   - Ensure CI passes
   - Get required approvals

3. **Merge Release**
   ```
   Go to Actions → Merge Release → Run workflow
   - Enter version number
   - Workflow validates approvals and merges
   ```

### Hotfix Process
1. **Create Hotfix Branch**
   ```
   Go to Actions → Create Hotfix Branch and PRs → Run workflow
   - Just click "Run workflow" (no inputs required)
   ```

2. **Review and Approve PRs**
   - Review generated PRs to `master` and `development`
   - Ensure CI passes
   - Get required approvals

3. **Merge Hotfix**
   ```
   Go to Actions → Merge Hotfix → Run workflow
   - Enter hotfix version number
   - Workflow validates approvals and merges
   ```

## Required Repository Secrets

| Secret | Description | Required For |
|--------|-------------|--------------|
| `GH_WORKFLOW` | Personal Access Token | Release workflows, cross-repo operations |

### Setting up GH_WORKFLOW Token
The `GH_WORKFLOW` secret requires a GitHub Personal Access Token with `repo` scope:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic) with `repo` scope
3. Add as repository secret: `gh secret set GH_WORKFLOW`

## Troubleshooting

### Common Issues

**Hotfix workflow fails with "Branch already exists"**
- Check if hotfix branch was created in previous failed run
- Delete the branch: `git push --delete origin hotfix/X.Y.Z`

**Merge workflow fails with "PR not approved"**
- Ensure PRs to both `master` and `development` are approved
- Check that PR state is "CLEAN" (no conflicts)

**Hotfix merge fails**
- Verify hotfix branch exists: `hotfix/X.Y.Z`
- Ensure PRs are created and approved for both target branches

### Manual Cleanup
If workflows fail and leave artifacts:

- Delete failed branches via GitHub UI
- Close draft PRs via GitHub UI

## Related Repositories

This repository's workflows interact with:
- **flood-service**: Release and hotfix workflows trigger corresponding workflows

---

For questions about release processes, contact the development team or check the [main project README](../readme.md) for environment setup information.
