# Check For Flooding Release

- Version: 8.23.0
- Proposed Release Date: 10th November 2025
- Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/27730/tab/release-report-all-issues


## Tickets

  
- FSR-1549 | Update flood warnings link (#1070)
  
- FSR-1547 | Station Map Tooltip Bug (#1066)
  
- FSR-1313 | Rainfall decimal places (#1064)
  
- FSR-1398 | Tidal river station showing below zero in list (#1053)
  
- FSR-1375 | Banner showing wrong icon (#1052)
  
- FSR-1509 | Adjust Map Key icon alignment (#1048)
  
- FSR-1538 | Data Table Console Error (https://eaflood.atlassian.net/browse/FSR-1538)

- FSR-1486 | Update river station ordering (https://eaflood.atlassian.net/browse/FSR-1486)
  

## Instructions


1. Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE

2. Execute LFW_{STAGE}_99_LOAD_RIVERS

3. Execute smoke tests and forward results

## Related Infrastructure Changes Required

- None
