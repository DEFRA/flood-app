# Check For Flooding Release

- Version: 8.15.0
- Proposed Release Date: Tuesday 6th May 2024
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/20503/tab/release-report-all-issues

## Tickets


[FSR-1403](https://eaflood.atlassian.net/browse/FSR-1403) - Update node runtime for the
CFF Lambdas

## Instructions


1. Update the nodejs runtime for the lambdas (see below)
1. Execute LFW_DEV_99_DEPLOY_FLOOD_DATA_PIPELINE_TF
1. Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

- Update the runtime defined in the terraform for the Check for Flooding lambdas (ie those named prd[gb]ldnlfw-*) in the non-live production environment to nodejs20.x
