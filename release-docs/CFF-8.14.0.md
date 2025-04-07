# Check For Flooding Release

* Version: 8.14.0
* Proposed Release Date: 10th April 2025
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/19777/tab/release-report-all-issues

## Sense Check

* Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
* Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
* Add additional Jira tickets from the related release notes in the 'Release 8.14.0' PR's created in:
  * [flood-service](https://github.com/DEFRA/flood-service)

* Add any required infrastructure changes such as redirects to the infrastructure changes section below
* Once this sense check is done, delete this section

## Tickets

  * FSR-1404 : Moving to Terraforms for CFF Lambda deployments

## Instructions

  1 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE
  2 - Execute LFW_{STAGE}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF

Execute smoke tests and forward results

## Related Infrastructure Changes Required

* Add env var LFW_DATA_ITMD_API_URL='imfs-prd1-thresholds-api.azurewebsites.net'
* Remove env var CHROME_DRIVER_CDNURL (this points to a legacy CDN which is
  no longer updated)
* No other specific infrastructure changes required from a development perspective but, given that
  the deployment mechanism is moving from serverless to terraforms, there may be some changes
  driven by WebOps
