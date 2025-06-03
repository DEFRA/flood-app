# Check For Flooding Release

- Version: 8.16.0
- Proposed Release Date: 
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/21662/tab/release-report-all-issues

## Sense Check

- Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
- Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
- Add additional Jira tickets from the related release notes in the 'Release 8.16.0' PR's created in:
  - [flood-service](https://github.com/DEFRA/flood-service)

- Add any required infrastructure changes such as redirects to the infrastructure changes section below
- Once this sense check is done, delete this section

## Tickets


  
- Merge pull request #960 from DEFRA/feature/FSR-1444-sonarcloud-issue-regex
  
- Merge pull request #916 from DEFRA/feature/FSR-1324-sonar-cloud-issues
  
- FSR-1426 | latest levels updates (#941)
  
- FSR-1386 : fix 404 error which occurs for a small number of towns (#948)
  
- FSR-000 : switch to using node-version-file in workflows (#915)
  


## Instructions


1. Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
