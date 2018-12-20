(function (window) {
  // creates a popup survey dialog that displays after set intervals
  // assumes js-cookie as Cookies

  var delayAfterDismissal = 900 // in seconds
  var delayAfterFirstVisit = 180 // in seconds
  var minsDefiningARecentVisit = 30
  var cookieFirstRecentVisitAt = 'firstRecentVisitAt'
  var cookieLastRecentVisitAt = 'lastVisitAt'
  var cookieHasGoneToSurvey = 'hasGoneToSurvey'
  var cookieDismissedAt = 'dismissedAt'
  var cookiePaths = '/'

// from https://github.com/Modernizr/Modernizr/blob/74655c45ad2cd05c002e4802cdd74cba70310f08/feature-detects/cookies.js
  function supportsCookies() {
    try {
      // Create cookie
      document.cookie = 'cookietest=1';
      var ret = document.cookie.indexOf('cookietest=') != -1;
      // Delete cookie
      document.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
      return ret;
    }
    catch (e) {
      return false;
    }
  }

  function persistHasGoneToSurvey () {
    Cookies.set(cookieHasGoneToSurvey,
      true,
      { path: cookiePaths,
        expires: 365 })
  }

  function persistDismissedAt () {
    var expires = new Date(new Date().getTime() + minsDefiningARecentVisit*60000)
    Cookies.set(
      cookieDismissedAt,
      new Date(),
      { path: cookiePaths,
      expires: expires})
  }

  function persistFirstRecentVisitAt () {
    var in30Mins = new Date(new Date().getTime() + minsDefiningARecentVisit*60000)
    Cookies.set(cookieFirstRecentVisitAt,
      new Date(),
      { path: cookiePaths,
        expires: in30Mins})
  }

  function showDialogAfterWait (seconds) {
    var inMs = seconds * 1000
    setTimeout(function () {
      myA11yDialog.show()
    }, inMs)
  }

  function getSecondsSince (startDate) {
    var now = new Date()
    var seconds = Math.floor((now.getTime() - startDate.getTime()) / 1000)
    return seconds
  }

  function getRemainingTime (startDate, seconds) {
    var startDate = new Date(startDate)
    var remaining = (getSecondsSince(startDate) > seconds) ? 0 : seconds - getSecondsSince(startDate)
    return remaining
  }

  function setupDialogListeners() {
    document.getElementById('a11y-do-survey').addEventListener('click', function () {
      persistDismissedAt('clicked-do-survey')
      persistHasGoneToSurvey()
    })
    document.getElementById('a11y-maybe-later').addEventListener('click', function () {
      persistDismissedAt()
      showDialogAfterWait(delayAfterDismissal)
    })
    document.getElementById('a11y-cross').addEventListener('click', function () {
      persistDismissedAt()
      showDialogAfterWait(delayAfterDismissal)
    })
    document.getElementById('a11y-dialog-overlay').addEventListener('click', function (dialog) {
      persistDismissedAt()
      showDialogAfterWait(delayAfterDismissal)
    })
  }

  function initDialogAndAssignToWindow() {
    // events firing a11y dialog not capturing keyboard so revert to click
    // to capture link events, escape functionality not working
    var dialogEl = document.getElementById('modal-dialog')
    var mainEl = document.getElementById('main-content')
    var dialog = new window.A11yDialog(dialogEl, mainEl)

    if (window.myA11yDialog) {
      throw 'window.myA11yDialog exists, exiting'
    } else {
      window.myA11yDialog = dialog
    }
  }

  function getSurveyState () {
    return {
      hasGoneToSurvey: Cookies.get(cookieHasGoneToSurvey),
      dismissedAt: Cookies.get(cookieDismissedAt),
      firstRecentVisitAt: Cookies.get(cookieFirstRecentVisitAt)
    }
  }

  function getSecondsTilShowDialog (firstRecentVisitAt,
                                    dismissedPopupAt,
                                    delayAfterFirstVisit,
                                    delayAfterDismissal) {
    var remaining = 0
    if (dismissedPopupAt) {
      remaining = getRemainingTime(dismissedPopupAt, delayAfterDismissal)
    } else {
      remaining = getRemainingTime(firstRecentVisitAt, delayAfterFirstVisit)
    }

    return remaining
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDialogAndAssignToWindow() // buggy, must always be initialised
    if (!supportsCookies()) {
      return
    }

    var state = getSurveyState()
    if (state.hasGoneToSurvey) {
      return
    }

    if (!state.firstRecentVisitAt) {
      persistFirstRecentVisitAt()
      // refresh state
      state = getSurveyState()
    }
    setupDialogListeners()
    
    var remaining = getSecondsTilShowDialog(
      state.firstRecentVisitAt,
      state.dismissedAt,
      delayAfterFirstVisit,
      delayAfterDismissal)

    showDialogAfterWait(remaining)
  })
})(window)
