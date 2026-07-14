# Check For Flooding Release

- Version: 9.0.0
- Proposed Release Date: 22nd July 2026
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/37414/tab/release-report-all-issues

## Sense Check

- Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
- Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
- Add additional Jira tickets from the related release notes in the 'Release 9.0.0' PR's created in:
  - [flood-service](https://github.com/DEFRA/flood-service)

- Add any required infrastructure changes such as redirects to the infrastructure changes section below
- Once this sense check is done, delete this section

## Tickets


  
- FSR-1657 | nodejs-24-upgrade (#1181)
  
- FSR-1673 | update cookie page (#1194)
  
- FSR-1686 | docker-image-release-candidates (#1195)
  
- FSR-1661 | github-action-standards (#1177)
  
- FSR-1629 | tag-manager-updates (#1144)
  
- FSR-1629 | permanent redirects (#1176)
  


## Instructions

1. Execute LFW_{STAGE}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF

    Ensure build parameters are set as follows:  
   - **TERRAGRUNT_BRANCH:** `master`  
   - **TERRAFORM_BRANCH:** `terraform-main`  
   - **MODULE_DEPLOY:** `lambda`

2. Execute LFW_{STAGE}_01_DEPLOY_APPLICATION - Tag - 9.0.0

3. Execute LFW_{STAGE}_03_DEPLOY_Service - Tag - 9.0.0


Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
