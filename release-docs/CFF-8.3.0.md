# Check For Flooding Release

* Version: 8.3.0
* Proposed Release Date: 22/05/2024
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/16850/tab/release-report-all-issues


## Tickets 
 
  * FSR-1193 | TA Update - 22 May 2024

## Instructions

This release is for target area updates

  1 - Update LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS jenkins job with the following properties update for the updated database name for production:

  DB_NAME=floodprdg
  ###### OR ########
  DB_NAME=floodprdb

  2 - Execute LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS
  
  3 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

* None
