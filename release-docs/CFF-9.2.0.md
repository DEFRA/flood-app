# Check For Flooding Release

- Version: 9.2.0
- Proposed Release Date: 18th November 2026
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/48167/tab/release-report-all-issues


## Tickets


- FSR-1717 | Target Area Update 


## Instructions

1. Update LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS jenkins job with the following properties update for the updated database name for production:

DB_NAME=floodprdg
OR

DB_NAME=floodprdb

2. Execute LFW_{STAGE}_99_LOAD_FLOOD_ALERT_AREAS ##NOTE if above property update not made this job will fail.

3. Execute LFW_{STAGE}_01_DEPLOY_APPLICATION - Tag - v9.2.0

4. Execute LFW_{STAGE}_03_DEPLOY_SERVICE - Tag - v9.2.0

5. Wait for 60 seconds

6. Execute smoke tests and forward results

TESTS_REPO_BRANCH: master


## Related Infrastructure Changes Required

- None
