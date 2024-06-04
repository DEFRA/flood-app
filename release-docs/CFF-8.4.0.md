# Check For Flooding Release

* Version: 8.4.0
* Proposed Release Date: 11th June 2024
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/16984/tab/release-report-all-issues

## Tickets
  
  * FSR-1157 : Sonarcloud issues on Flood App
  * FSR-1158 : Sonarcloud issues on Flood Service
  * FSR-1159 : Sonarcloud issues on Flood Data
  * FSR-1168 : Update Flood DB dependencies
  * FSR-1171 : Update Flood Data dependencies
  * FSR-1177 : Bug Fix | 500 error when whitespace searched on /river-and-sea-levels
  * FSR-818  : Create Lambda function to use the DisplayTimeSeries property from IMTD API to populate FFOI_Station Table

## Instructions

 1 - LFW_{stage}_99_DEPLOY_FLOOD_DATA_PIPELINE

 2 - LFW_{stage}_02_UPDATE_DATABASE

 3 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

 1 - Run the LFW terraform iam module to add lamda permission to the developer role
