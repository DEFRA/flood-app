# Check For Flooding Release

* Version: 8.12.0
* Proposed Release Date: 
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/17244/tab/release-report-all-issues

## Sense Check

* Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
* Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
* Add additional Jira tickets from the related release notes in the 'Release 8.12.0' PR's created in:
  * [flood-service](https://github.com/DEFRA/flood-service)

* Add any required infrastructure changes such as redirects to the infrastructure changes section below
* Once this sense check is done, delete this section

## Tickets


  
  * Merge pull request #762 from DEFRA/feature/FSR-452-prominent-river-level-gauges
  
  * Merge pull request #895 from DEFRA/feature/FSR-607-welsh-station-height-data-consistency-99
  
  * FSR-607: Add unit test for displaying only active NRW data on river-and-sea-levels list
  
  * FSR-607: updated tooltip to show trend and state for NRW stations, set decimal to 2 places, removed space between value and unit
  
  * FSR-607: Sync height data for NRW stations on river-and-sea-level page list
  
  * FSR-1377 | Search bug fixes (#892)
  
  * FSR-1378 | fix sonarcloud issue (#894)
  
  * FSR-452: Set z-index for stations (2) and rainfall (1) layers to ensure proper visibility.
  


## Instructions


  1 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

* None
