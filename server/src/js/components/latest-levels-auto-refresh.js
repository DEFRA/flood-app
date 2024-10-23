/* global DOMParser */

class LatestLevelsAutoRefresh {
  constructor (targetMinutes = [3, 18, 33, 48]) {
    this.timeout = null
    this.timeAgoInterval = null
    this.liveStatusMessages = []
    this.targetMinutes = targetMinutes

    this.latestLevels = document.querySelectorAll('.defra-live__item')
  }

  updateLiveStatus = () => {
    if (this.liveStatusMessages.length === 0) {
      return
    }

    const element = document.querySelector('[data-live-status]')

    if (!element) {
      return
    }

    element.innerHTML = ''

    const p = document.createElement('p')
    p.innerText = this.liveStatusMessages.join('. ')
    element.append(p)
  }

  updateTimeAgo = () => {
    console.log('--updateTimeAgo() started')

    setTimeout(() => {
      this.renderTimeAgo()
      this.timeAgoInterval = setInterval(this.renderTimeAgo, 60000)
    }, (60 - new Date().getSeconds()) * 1000)
  }

  renderTimeAgo = () => {
    const elements = document.querySelectorAll('[data-item-time]')

    elements.forEach(element => {
      const timeAgoText = element.textContent
      const timeAgoValue = parseInt(timeAgoText, 10)

      console.log('--currentTime', timeAgoText)

      if (!timeAgoText.includes('hour')) {
        element.textContent = `${timeAgoValue + 1} minutes ago`
      }

      if ((timeAgoValue + 1) > 60) {
        element.textContent = 'more than 1 hour ago'
      }
    })
  }

  fetchRiverLevels = (callback) => {
    console.log('fetchRiverLevels...')

    this.liveStatusMessages = []

    fetch(window.location.href)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch data')
        }

        return res.text()
      })
      .then(html => {
        this.updateRiverLevels(html)

        if (callback) {
          callback()
        }
      })
      .catch(error => {
        console.error('Error updating levels:', error)

        this.liveStatusMessages.push('There was an error getting the latest level')
      })
      .finally(() => {
        this.updateLiveStatus()
      })
  }

  updateRiverLevels = (html) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const currentStatus = document.querySelector('[data-severity-status]')?.getAttribute('data-severity-status')
    const newStatus = doc.querySelector('[data-severity-status]')?.getAttribute('data-severity-status')

    if (currentStatus !== newStatus) {
      return window.location.reload()
    }

    // Get elements from fetched content
    const fetchedElements = Array.from(doc.querySelectorAll('.defra-live .defra-live__item'))

    // Check if any elements are missing in the fetched data
    const isMissingElements = this.latestLevels.length !== fetchedElements.length
    console.log('isMissingElements', isMissingElements, this.latestLevels.length, fetchedElements.length)
    console.log('latestLevels', this.latestLevels)
    console.log('fetchedElements', fetchedElements)

    if (isMissingElements) {
      return this.liveStatusMessages.push('Warnings have been removed, please refresh the page.')
    }

    fetchedElements.forEach((fetchedElement) => {
      const itemId = fetchedElement.getAttribute('data-item-id')
      const itemRiverName = fetchedElement.getAttribute('data-item-name')
      const itemRiverAgency = fetchedElement.getAttribute('data-item-agency')

      const fetchedTime = fetchedElement.querySelector('[data-item-time]')
      const fetchedValue = fetchedElement.querySelector('[data-item-value]')
      const fetchedStatus = fetchedElement.getAttribute('data-item-status')

      const currentItem = document.querySelector(`[data-item-id="${itemId}"]`)

      console.log('fetchedElement', itemId, itemRiverName, itemRiverAgency)

      if (currentItem) {
        const currentTime = currentItem.querySelector('[data-item-time]')
        const currentValue = currentItem.querySelector('[data-item-value]')
        const currentStatus = currentItem.getAttribute('data-item-status')

        console.log('--currentValue', currentValue?.textContent, currentStatus, currentTime)
        console.log('--fetchedValue', fetchedValue?.textContent, fetchedStatus, fetchedTime)
        console.log('--requires update?', fetchedValue?.textContent !== currentValue?.textContent)

        if (fetchedStatus === currentStatus) {
          if (fetchedValue?.textContent !== currentValue?.textContent) {
            console.log('--new value fetched')
            clearInterval(this.timeAgoInterval)
            console.log('--interval cleared')

            currentValue.textContent = fetchedValue.textContent

            this.liveStatusMessages.push(`The ${itemRiverName} at ${itemRiverAgency} level was ${fetchedValue.textContent} metres ${fetchedTime.textContent}`)

            this.updateTimeAgo()
          } else {
            console.log('--no change')
          }

          currentTime.textContent = fetchedTime.textContent
        } else {
          this.liveStatusMessages.push('Please refresh the page')
        }
      } else {
        this.liveStatusMessages.push('Please refresh the page')
      }
    })
  }

  nextUpdate = () => {
    clearTimeout(this.timeout)

    const now = new Date()
    const nowMinute = now.getMinutes()

    const nextTargetMinute = this.targetMinutes.find(minute => minute > nowMinute) ?? this.targetMinutes[0]

    console.log('--Current minute:', nowMinute)
    console.log('--Next target minute:', nextTargetMinute)

    // Create the next target date based on the next target minute
    const nextTargetDate = new Date(now)
    nextTargetDate.setMinutes(nextTargetMinute)
    nextTargetDate.setSeconds(0)
    nextTargetDate.setMilliseconds(0)

    if (nowMinute > this.targetMinutes[this.targetMinutes.length - 1]) {
      nextTargetDate.setHours(nextTargetDate.getHours() + 1)
    }

    const delay = nextTargetDate.getTime() - now.getTime()

    console.log('--delay (calc)', Math.round(delay / 1000 / 60))
    console.log(`Next update scheduled in ${Math.round(delay / 1000 / 60)} minutes at ${nextTargetDate.toLocaleTimeString()}\n\n`)

    // Schedule the next update
    this.timeout = setTimeout(() => {
      this.fetchRiverLevels()
      this.nextUpdate()
    }, delay)
  }
}

window.LatestLevelsAutoRefresh = LatestLevelsAutoRefresh
