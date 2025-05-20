# Check For Flooding Release

* Version: 8.12.0
* Proposed Release Date: 27th January 2025
* Jira Release Overview: https://eaflood.atlassian.net/projects/FSR/versions/17244/tab/release-report-all-issues

## Tickets

  
  * FSR-607 | Welsh Station Pages – Height Data Missing from Rivers list but Present on Map Tooltip
  
  * FSR-1377 | Location Search Issues (CFF / Bing)
  
  * FSR-452 | Set z-index for stations (2) and rainfall (1) layers to ensure proper visibility.
  
## Instructions


  1 - Execute LFW_{STAGE}_04_UPDATE_FLOOD_APP_AND_SERVICE_PIPELINE


Execute smoke tests and forward results

## Notes

  * A change has been made to the FLOOD_APP_BING_URL in our flood-app.profile config file within lfwconfig in GitLab. We have pushed this change up to master branch. New URL shown below.
      
      `FLOOD_APP_BING_URL="https://dev.virtualearth.net/REST/v1/Locations?query=%s,GB&userRegion=GB&include=ciso2&c=en-GB&maxResults=%s&userIP=127.0.0.1&key=%s"`
    
## Related Infrastructure Changes Required

* None
