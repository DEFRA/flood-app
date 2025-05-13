class LatestLevelsAutoRefresh {
  constructor (targetMinutes = [4, 19, 34, 49]) {
    this.timeout = null
    this.timeAgoInterval = null
    this.liveStatusMessages = []
    this.targetMinutes = targetMinutes

    this.hasChanges = null

    this.latestLevels = document.querySelectorAll('.defra-live__item')
  }

  fetchData = async () => {
    const res = await fetch(`/api/latest-levels/${window.location.pathname.split('/').pop()}`, { cache: 'no-store' })
    return await res.json()
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

  initializeTimeAgoUpdates = () => {
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

      if (!timeAgoText.includes('hour')) {
        element.textContent = `${timeAgoValue + 1} minutes ago`
      }

      if ((timeAgoValue + 1) > 59) {
        element.textContent = 'More than 1 hour ago'
      }
    })
  }

  renderRiverLevels = (data) => {
    const { levels, severity } = data

    const currentSeverity = document.querySelector('[data-severity-status]')?.getAttribute('data-severity-status')

    if (currentSeverity !== severity) {
      return window.location.reload()
    }

    const isMissingElements = this.latestLevels.length !== levels.length

    if (isMissingElements) {
      return this.liveStatusMessages.push('Warnings have been removed, please refresh the page.')
    }

    levels.forEach(item => {
      const element = document.querySelector(`[data-item-id="${item.rloi_id}"]`)

      if (item.isSuspendedOrOffline) {
        return this.liveStatusMessages.push('Please refresh the page')
      }

      if (!element) {
        return this.liveStatusMessages.push('Please refresh the page')
      }

      const elementTimeStamp = element.attributes['data-item-timestamp'].value
      const elementValue = element.querySelector('[data-item-value]')
      const elementTime = element.querySelector('[data-item-time]')

      const itemValue = item.latest_level
      const itemTime = item.value_timestamp

      if (itemTime !== elementTimeStamp) {
        this.hasChanges = true
        elementValue.textContent = itemValue
        elementTime.textContent = item.formatted_time
        element.setAttribute('data-item-timestamp', itemTime)

        this.liveStatusMessages.push(`The ${item.river_name} at ${item.external_name} level was ${itemValue} metres ${item.formatted_time}`)
      } else {
        this.hasChanges = false
      }

      const now = new Date()
      console.log({
        now: now.toLocaleString(),
        hasChanges: this.hasChanges,
        elementValue: elementValue.textContent,
        elementTime: elementTime.textContent,
        elementTimeStamp,
        itemValue,
        itemTime
      })
    })
  }

  retry = async () => {
    this.hasChanges = null

    try {
      const data = await this.fetchData()

      this.renderRiverLevels(data)
    } catch (err) {
      console.error('[Error] retrying to fetch latest levels', err)
      this.liveStatusMessages.push('There was an error retrying to get the latest level')
    } finally {
      this.updateLiveStatus()
    }
  }

  fetchRiverLevels = async (callback) => {
    this.liveStatusMessages = []

    try {
      const data = await this.fetchData()

      clearInterval(this.timeAgoInterval)

      this.renderRiverLevels(data)

      if (this.hasChanges === false) {
        setTimeout(() => {
          this.retry()
        }, 10000)
      }

      this.initializeTimeAgoUpdates()

      if (callback) {
        callback(data)
      }
    } catch (err) {
      console.error('[Error] fetching latest levels data', err)
      this.liveStatusMessages.push('There was an error getting the latest level')
    } finally {
      this.updateLiveStatus()
    }
  }

  nextUpdate = async () => {
    clearTimeout(this.timeout)

    const now = new Date()
    const nowMinute = now.getMinutes()

    const nextTargetMinute = this.targetMinutes.find(minute => minute > nowMinute) ?? this.targetMinutes[0]

    // Create the next target date based on the next target minute
    const nextTargetDate = new Date(now)
    nextTargetDate.setMinutes(nextTargetMinute)
    nextTargetDate.setSeconds(0)
    nextTargetDate.setMilliseconds(0)

    if (nowMinute >= this.targetMinutes[this.targetMinutes.length - 1]) {
      nextTargetDate.setHours(nextTargetDate.getHours() + 1)
    }

    const delay = nextTargetDate.getTime() - now.getTime()

    // Schedule the next update
    this.timeout = setTimeout(() => {
      this.fetchRiverLevels()
      this.nextUpdate()
    }, delay)
  }
}

window.LatestLevelsAutoRefresh = LatestLevelsAutoRefresh
