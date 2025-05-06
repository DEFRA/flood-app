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
    console.log('\nupdateLiveStatus()')

    if (this.liveStatusMessages.length === 0) {
      return
    }

    const element = document.querySelector('[data-live-status]')

    console.log('- element', element)

    if (!element) {
      return
    }

    element.innerHTML = ''

    const p = document.createElement('p')
    p.innerText = this.liveStatusMessages.join('. ')
    element.append(p)

    console.log('\n---Done---\n')
  }

  initializeTimeAgoUpdates = () => {
    console.log('\ninitializeTimeAgoUpdates()')

    setTimeout(() => {
      this.renderTimeAgo()
      this.timeAgoInterval = setInterval(this.renderTimeAgo, 60000)

      console.log('- timeAgoInterval', this.timeAgoInterval)
    }, (60 - new Date().getSeconds()) * 1000)
  }

  renderTimeAgo = () => {
    console.log('\nrenderTimeAgo()')

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

      console.log('- new time ago:', element.textContent)
    })
  }

  renderRiverLevels = (data) => {
    console.log('\nrenderRiverLevels()')

    const { levels, severity } = data

    const currentSeverity = document.querySelector('[data-severity-status]')?.getAttribute('data-severity-status')

    console.log('-- page: severity', currentSeverity)
    console.log('-- api: severity', severity)

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

      const elementId = element.getAttribute('data-item-id')
      const elementRiverName = element.getAttribute('data-item-name')
      const elementRiverExternalName = element.getAttribute('data-item-external-name')

      const elementValue = element.querySelector('[data-item-value]')
      const elementTime = element.querySelector('[data-item-time]')

      const itemValue = item.latest_level
      const itemTime = item.value_timestamp

      if (itemValue !== elementValue.textContent) {
        console.log('-- [element]')
        console.log('---- id', elementId)
        console.log('---- riverName', elementRiverName)
        console.log('---- riverExternalName', elementRiverExternalName)
        console.log('---- value', elementValue.textContent)
        console.log('---- time', elementTime.textContent)

        console.log('\n-- [api]')
        console.log('---- id', item.rloi_id)
        console.log('---- riverName', item.river_name)
        console.log('---- riverExternalName', item.external_name)
        console.log('---- value', itemValue)
        console.log('---- time', itemTime)

        elementValue.textContent = itemValue

        this.liveStatusMessages.push(`The ${item.river_name} at ${item.external_name} level was ${itemValue} metres ${itemTime}`)
      } else {
        console.log('\n---No changes!---')

        this.hasChanges = false
      }

      elementTime.textContent = item.value_timestamp
    })
  }

  retry = async () => {
    console.log('\nretry()')

    this.hasChanges = null

    try {
      const data = await this.fetchData()
      console.log(data)

      this.renderRiverLevels(data)
    } catch (err) {
      console.error('[Error] retry', err)
      this.liveStatusMessages.push('There was an error retrying to get the latest level')
    } finally {
      this.updateLiveStatus()
      console.log('\n---Retry done!---\n\n\n\n')
    }
  }

  fetchRiverLevels = async (callback) => {
    console.log('\nfetchRiverLevels()')

    this.liveStatusMessages = []

    try {
      const data = await this.fetchData()
      console.log(data)

      clearInterval(this.timeAgoInterval)

      this.renderRiverLevels(data)

      if (this.hasChanges === false) {
        console.log('- triggering retry in ~10s...\n\n')

        setTimeout(() => {
          this.retry()
        }, 10000)
      }

      this.initializeTimeAgoUpdates()

      if (callback) {
        callback(data)
      }
    } catch (err) {
      console.error('[Error] fetchRiverLevels', err)
      this.liveStatusMessages.push('There was an error getting the latest level')
    } finally {
      this.updateLiveStatus()
    }
  }

  nextUpdate = async () => {
    console.log('\nnextUpdate()')

    clearTimeout(this.timeout)

    const now = new Date()
    const nowMinute = now.getMinutes()

    const nextTargetMinute = this.targetMinutes.find(minute => minute > nowMinute) ?? this.targetMinutes[0]

    console.log('- now', now)
    console.log('- nowMinute', nowMinute)
    console.log('- next Target Minute', nextTargetMinute)

    // Create the next target date based on the next target minute
    const nextTargetDate = new Date(now)
    nextTargetDate.setMinutes(nextTargetMinute)
    nextTargetDate.setSeconds(0)
    nextTargetDate.setMilliseconds(0)

    if (nowMinute >= this.targetMinutes[this.targetMinutes.length - 1]) {
      nextTargetDate.setHours(nextTargetDate.getHours() + 1)
    }

    const delay = nextTargetDate.getTime() - now.getTime()

    console.log('- nextTargetDate', nextTargetDate)
    console.log('- delay', delay, `${((delay / 1000) / 60).toFixed(2)}m`)

    // Schedule the next update
    this.timeout = setTimeout(() => {
      this.fetchRiverLevels()
      this.nextUpdate()
    }, delay)
  }
}

window.LatestLevelsAutoRefresh = LatestLevelsAutoRefresh
