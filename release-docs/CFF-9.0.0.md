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

4. Update smoke test config properties content setion to include:

SCRIPT_REPO_URL=git@gitlab-dev.aws-int.defra.cloud:flood/flood-pipelines.git
SCRIPT_REPO_BRANCH=feature/FSR-1629-ecs-migration
SCRIPT_REPO_CREDENTIAL_ID=gitlab-dev
SCRIPT_REPO_DIRECTORY=lfw

# For S3 access
LFW_TARGET_ENV_NAME=<<Change me to reflect required PRD environment example prdbldn>>ldn 

# For SSM parameter store access
SSM_PARAM_STORE_ENV=<<Change me to reflect required PRD environment example prdb/ldn>>/ldn 

5. Configure git@gitlab-dev.aws-int.defra.cloud:flood/flood-pipelines.git to use branch */feature/FSR-1629-ecs-migrationExecute smoke tests and forward results

## Related Infrastructure Changes Required

- Remove redirects for :  /find-location
                          /plan-ahead-for-flooding
                          /what-to-do-in-a-flood
                          /recovering-after-a-flood
                          /what-happens-after-a-flood
