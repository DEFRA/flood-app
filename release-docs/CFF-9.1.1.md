# Check For Flooding Release

- Version: 9.1.1
- Proposed Release Date:
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/48100/tab/release-report-all-issues

## Sense Check

- Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
- Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
- Add additional Jira tickets from the related release notes in the 'Release 9.1.1' PR's created in:
  - [flood-service](https://github.com/DEFRA/flood-service)

## Tickets

- FSR-1729 | upgrade-nodejs-parent-image (#1256)



## Instructions
1. MISC folder Execute LFW_{STAGE}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF - Branch - release/2.7.1

    Ensure build parameters are set as follows:
   - **TERRAGRUNT_BRANCH:** `master`
   - **TERRAFORM_BRANCH:** `terraform-main`
   - **MODULE_DEPLOY:** `lambda`

2. Disable LFW_{STAGE}_08_SMOKE_TESTS temporarily to ensure that smoke tests do not run until the new deploments of flood-app and flood-service have become operational

3. Execute LFW_{STAGE}_01_DEPLOY_APPLICATION - Tag - 9.1.1

4. Execute LFW_{STAGE}_03_DEPLOY_Service - Tag - 9.1.1

5. Wait for 60 seconds

6. Enable LFW_{STAGE}_08_SMOKE_TESTS

7. Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
