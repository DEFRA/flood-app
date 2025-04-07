# Check For Flooding Release

- Version: 8.14.0
- Proposed Release Date: 10th April 2025
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/19777/tab/release-report-all-issues

## Tickets

- FSR-1404 : Moving to Terraforms for CFF Lambda deployments
- FSR-1411 : IMTD API Endpoint : update hardcoded endpoint for Lambdas

## Instructions

1. Execute LFW\_{STAGE}\_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE
2. Execute LFW\_{STAGE}\_99_DEPLOY_FLOOD_DATA_PIPELINE_TF

Execute smoke tests and forward results

## Related Infrastructure Changes Required

- Add env var LFW_DATA_ITMD_API_URL='imfs-prd1-thresholds-api.azurewebsites.net'
  - Prod value to be 'imfs-prd1-thresholds-api.azurewebsites.net'
  - Non prod envs values to be 'imfs-snd1-thresholds-api.azurewebsites.net' or 'imfs-pre1-thresholds-api.azurewebsites.net'   
- Remove env var CHROME_DRIVER_CDNURL (this points to a legacy CDN which is
  no longer updated)
- No other specific infrastructure changes required from a development perspective but, given that
  the deployment mechanism is moving from serverless to terraforms, there may be some changes
  driven by WebOps
