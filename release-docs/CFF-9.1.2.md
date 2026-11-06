# Check For Flooding Release

- Version: 9.1.2
- Proposed Release Date: Wednesday 11th November 2026
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/48008/tab/release-report-all-issues

## Sense Check

- Note that this is the definitive release notes for WebOps. The release notes in flood-service and flood-db are for CFF dev team use only.
- Cross check the list of Jira tickets below with those in the Jira release linked to above and update where needed
- Add additional Jira tickets from the related release notes in the 'Release 9.1.2' PR's created in:
  - [flood-service](https://github.com/DEFRA/flood-service)

- Add any required infrastructure changes such as redirects to the infrastructure changes section below
- Once this sense check is done, delete this section

## Tickets



- FSR-1698 | Upgrade to neostandard (#1243)

- FSR-1667 | use my location outside england (#1242)



## Instructions


1. Execute LFW_{STAGE}_01_DEPLOY_APPLICATION - Tag - v9.1.2

2. Execute LFW_{STAGE}_03_DEPLOY_Service - Tag - v9.1.2

3. Wait for 60 seconds

4. Enable LFW_{STAGE}_08_SMOKE_TESTS

5. Execute smoke tests and forward results

   TESTS_REPO_BRANCH: master



Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
