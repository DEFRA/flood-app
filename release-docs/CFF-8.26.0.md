# Check For Flooding Release

- Version: 8.26.0
- Proposed Release Date: 17th March 2026
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/31715/tab/release-report-all-issues


## Tickets
  
- FSR-1603 | Node update on CFF flood-data - v20 to v22

## Instructions


1.  Execute LFW_{STAGE}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF

    Ensure build parameters are set as follows:  
   - **TERRAGRUNT_BRANCH:** `master`  
   - **TERRAFORM_BRANCH:** `terraform-main`  
   - **MODULE_DEPLOY:** `lambda`
     
2.  Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE
   
3.  Execute smoke tests and forward results

## Related Infrastructure Changes Required

- All Lambdas to be updated to run on node version 22
