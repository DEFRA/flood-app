/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

$(document).ready(function () {
  window.GOVUKFrontend.initAll()
})

/*
// Tabs - Add next tab link
var $tabs = document.querySelectorAll('.app-risk-detail__copy-container');
var $tabLinkText = ["now", "outlook"];

$tabs.forEach(function(panel, i) {
  var $nextTabLink = document.createElement('a');
  var $nextTabLinkIndex = (i < $tabs.length - 1) ? i+1 : 0;
  $nextTabLink.setAttribute('href',  "#" + $tabLinkText[$nextTabLinkIndex]);
  $nextTabLink.setAttribute('class', 'anchor govuk-tabs__tab-link-text');
  $nextTabLink.textContent = "View " + $tabLinkText[$nextTabLinkIndex];
  panel.appendChild($nextTabLink);
})
*/


