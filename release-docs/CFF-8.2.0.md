# Check For Flooding Release

* Version: 8.2.0
* Proposed Release Date: Wednesday 01 May 2024
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/16986/tab/release-report-all-issues

## Tickets


  
  * FSR-1192 | Add missing package used in release notes creation (#680)
  
  * FSR-1190 | Search content change (#679)
 
  * FSR-1134 | SEO improvements - return 404 for unknown locations (#612)
  
  * FSR-596 | Remove Flood Guidance Links, Update Redirects, Change Banner Links (#651)
  
  * FSR-1188 | Remove internal redirect from /find-location to / (#671)
  
  * FSR-000 | Add sense check to release notes (#668)
  
  * FSR-1133 | Package updates (#624)
  
  * FSR-000 | Fix issue in test code which was causing failing tests before 10:00am (#667)
  
  * FSR-1077 | Station line chart to display 6am on x axis (#625)
  


## Instructions


  1 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

  Add redirects 
  
  * From Find Location page (https://check-for-flooding.service.gov.uk/find-location) to the Check for Flooding national page (https://check-for-flooding.service.gov.uk/)
  
  * From How to plan page (https://www.gov.uk/prepare-for-flooding/plan-ahead-for-flooding) to Prepare for flooding (https://www.gov.uk/prepare-for-flooding)

  * From What to do in a flood page (https://www.gov.uk/prepare-for-flooding/what-to-do-in-a-flood) to Flood alerts & warnings (https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do)
  
  * From How to recover from a flood page (https://check-for-flooding.service.gov.uk/recovering-after-a-flood) to What to do after a flood (https://www.gov.uk/after-flood)
  
  * From What happens after a flood (https://check-for-flooding.service.gov.uk/what-happens-after-a-flood) to What to do after a flood (https://www.gov.uk/after-flood)
