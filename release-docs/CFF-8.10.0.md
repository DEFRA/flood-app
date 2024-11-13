# Check For Flooding Release

* Version: 8.10.0
* Proposed Release Date: 
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/16852/tab/release-report-all-issues

## Sense Check

* Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
* Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
* Add additional Jira tickets from the related release notes in the 'Release 8.10.0' PR's created in:
  * [flood-service](https://github.com/DEFRA/flood-service)

* Add any required infrastructure changes such as redirects to the infrastructure changes section below
* Once this sense check is done, delete this section

## Tickets


  
  * Merge pull request #876 from DEFRA/fix/FSR-1357-map-button-text-color-persistence
  
  * Merge pull request #883 from DEFRA/feature/FSR-1356-station-page-threshold-level-content-updates
  
  * FSR-1357: Change button color to remain blue for all events
  
  * FSR-1357: Ensure map button text color remains blue on refresh and after visit across all pages
  
  * FSR-1356: Add hyphen in &#39;low-lying land&#39; and full stop to &#39;One or more flood alerts may be issued&#39; on station threshold level list
  


## Instructions


  1 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

* None
