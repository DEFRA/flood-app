# Check For Flooding Release

- Version: 9.1.0
- Proposed Release Date: 22/10/2026
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/48009/tab/release-report-all-issues


## Tickets

- FSR-1693 | Upgrade Gov uk Front end v6.4.0

- FSR-1694 | Update Webchat

- FSR-1675 | Bring cookies inline with defra standards

- FSR-1660 | Update map link colour

- FSR-1617 | Upgrade govuk-frontend from v5.10.0 to v6.4.0 on flood-app (Breaking Change)
  


## Instructions


1. Execute LFW_{STAGE}_01_DEPLOY_APPLICATION - Tag - 9.1.0

2. Execute LFW_{STAGE}_03_DEPLOY_Service - Tag - 9.1.0


Execute smoke tests and forward results

## Related Infrastructure Changes Required

- Update service-down folder contents with updated files. Can be taken from any non-production env (e.g Amazon S3 > Buckets > lfw-ecs-dev.aws-int.defra.cloud) or available here ([service-down](https://defra-my.sharepoint.com/:f:/g/personal/lee_gordon_defra_gov_uk/IgCgHCIB07cATrwOH6_yaiyzASHSiZ9tKi7wq4ie6EbuWa4?e=gXc7Cr) --> contact Lee Gordon if access to folder required)
