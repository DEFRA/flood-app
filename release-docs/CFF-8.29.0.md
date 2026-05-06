# Check For Flooding Release

- Version: 8.29.0
- Proposed Release Date: 7th May 2026
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/32016/tab/release-report-all-issues

## Tickets

- FSR-1634 | npm updates
- FSR-1624 | Update flood-data repository workflows to protect against npm worm attacks
- FSR-1615 | Update FGS API access to for new API key
- FSR-1180 | Update webchat dependencies and subsequent version in flood-app

## Instructions

1.  Execute LFW_{STAGE}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF

    Ensure build parameters are set as follows:  
   - **TERRAGRUNT_BRANCH:** `master`  
   - **TERRAFORM_BRANCH:** `terraform-main`  
   - **MODULE_DEPLOY:** `lambda`
     
2. Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE
   
3. Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
