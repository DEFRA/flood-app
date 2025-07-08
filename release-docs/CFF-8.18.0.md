# Check For Flooding Release

- Version: 8.18.0
- Proposed Release Date: 9th July 2025
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/23670/tab/release-report-all-issues


## Tickets


FSR 1454 | July TA update - https://eaflood.atlassian.net/browse/FSR-1454


## Instructions


1.  Update LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS jenkins job with the following properties update for the updated database name for production:

DB_NAME=floodprdg
OR
DB_NAME=floodprdb

2. Execute LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS ##NOTE if above property update not made this job will fail.

3. Execute LFW_{stage}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
