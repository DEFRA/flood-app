# Check For Flooding Release

* Version: 8.2.0
* Proposed Release Date: Wednesday 01 May 2024
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/16986/tab/release-report-all-issues

## Sense Check

* Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
* Add additional Jira tickets from the related release notes:
  * [flood-service](https://github.com/DEFRA/flood-service/blob/release/8.2.0/release-docs/CFF-8.2.0.md)

* Add any required infrastructure changes such as redirects to the infrastructure changes section below
* Once this sense check is done, delete this section

## Tickets


  
  * FSR-1192 | Add missing package used in release notes creation (#680)
  
  * FSR-1190 | search content change (#679)
  
  * FSR-596 | Fix &quot;Removed message&quot; bug (FSR-1191), refactor tests and improve coverage (#678)
  
  * FSR-1134 | SEO improvements - return 404 for unknown locations (#612)
  
  * FSR-596 | Remove Flood Guidance Links, Update Redirects, Change Banner Links (#651)
  
  * FSR-1188 | Remove internal redirect from /find-location to / (#671)
  
  * FSR-000 | Add sense check to release notes (#668)
  
  * FSR-1133 | package updates (#624)
  
  * FSR-000 | Fix issue in test code which was causing failing tests before 10:00 am (#667)
  
  * FSR-1077 | Station line chart to display 6am on x axis (#625)
  


## Instructions


  1 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

* None
