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


1. Execute LFW_{STAGE}_02_UPDATE_DATABASE (if a checksum error is received see the notes below)
2. Execute LFW_{STAGE}_03_UPDATE_GEOSERVER_PIPELINE
3. Execute LFW_{STAGE}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF  

   Ensure build parameters are set as follows:  
   - **TERRAGRUNT_BRANCH:** `master`  
   - **TERRAFORM_BRANCH:** `terraform-main`  
   - **MODULE_DEPLOY:** `lambda`

4. Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE

Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None




### Fixing Checksums

If a change has been made to an old changelog sql file or ordering has been changed, this will cause a `checksum` error in the Jenkins job.

This will look something like:

bash
# example
changelog/db.changelog-0.4.1.xml::3::username was: 9:d969a0b04f0b1c582d04774622630636 but is now: 9:b41459975317ac437f2c2b9985ac6141

To fix this, either:

#### Update the checksum manually:

1. Copy the "is now" checksum output from the Jenkins job error
2. Log in to that environments database (via a postgres client) and open the `databasechangelog` table
3. Find the row that the above will correspond to (for example):
    - column: filename - `changelog/db.changelog-0.4.1.xml`
    - column: id - `3`
    - column: author - `username`
4. Update column `md5sum` with the new checksum and save the changes
5. Run the Jenkins update job again
