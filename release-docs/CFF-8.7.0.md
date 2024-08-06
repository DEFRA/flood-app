# Check For Flooding Release

* Version: 8.7.0
* Proposed Release Date: 
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/16851/tab/release-report-all-issues

## Sense Check

* Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
* Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
* Add additional Jira tickets from the related release notes in the 'Release 8.7.0' PR's created in:
  * [flood-service](https://github.com/DEFRA/flood-service)

* Add any required infrastructure changes such as redirects to the infrastructure changes section below
* Once this sense check is done, delete this section

## Tickets

  FSR-1269 - Target Area Update August 2024 - https://eaflood.atlassian.net/browse/FSR-1269


## Instructions


  1 - Update LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS jenkins job with the following properties update for the updated database name for production:

  DB_NAME=floodprdg
  ###### OR ########
  DB_NAME=floodprdb

  2 - Execute LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS  ##NOTE if above property update not made this job will fail.

  3 - Execute LFW_{stage}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE

Execute smoke tests and forward results

## Related Infrastructure Changes Required

* None
