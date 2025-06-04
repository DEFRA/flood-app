# Check For Flooding Release

- Version: 8.16.0
- Proposed Release Date: 10th June 2025
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/21662/tab/release-report-all-issues


## Tickets

  
- FSR-1426 | Latest levels updates
  
- FSR-1386 | Fix 404 error which occurs for a small number of towns

- FSR-1376 | Latest level content and hyperlink uses agency_name instead of external_name
  
- FSR-1408 | "Minutes ago" does not update as expected on scheduled refresh

- FSR-1410 | Incorrect content in latest levels box for warnings

- FSR-1415 | Redis upgrade v5 to v7

- FSR-1444 | Fix issue with regex vulnerability
  


## Instructions


1. Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE

Execute smoke tests and forward results

## Related Infrastructure Changes Required

- Web-Ops to complete Elasticache/Redis upgrade
