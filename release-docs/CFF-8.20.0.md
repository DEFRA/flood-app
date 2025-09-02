# Check For Flooding Release

- Version: 8.20.0
- Proposed Release Date: 4th September 2025
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/24825/tab/release-report-all-issues

## Tickets


  
- FSR-1006 | Enhance Station and Map Navigation Logic for Multi-Stations
- FSR-212 | Error in Creating New Empty Database  
- FSR-1039 | Error in Creating New Empty Database  
- FSR-1136 | Update aws-sdk to latest version for CFF  
- FSR-1461 | (DB Update) Fix Liquibase Scripts  
- FSR-1498 | (DB Setup) Fix rds_initial_setup.sql 



## Instructions


1. Execute LFW_{STAGE}_02_UPDATE_DATABASE
2. Execute LFW_{STAGE}_03_UPDATE_GEOSERVER_PIPELINE
3. Execute LFW_{STAGE}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF  

   Ensure build parameters are set as follows:  
   - **TERRAGRUNT_BRANCH:** `master`  
   - **TERRAFORM_BRANCH:** `RITM1275647-NewLambdaVars`  
   - **MODULE_DEPLOY:** `lambda`

4. Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE

Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
