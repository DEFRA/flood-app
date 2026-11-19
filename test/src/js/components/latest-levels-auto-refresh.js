const { JSDOM } = require('jsdom')

describe('latestLevels', () => {
  let window
  let document
  let mockFetch

  beforeAll(() => {
    const html = `
      <output data-live-status></output>
      <div class="defra-live" data-severity-status="severe">
        <div class="defra-live__item" data-item-status="false" data-item-name="River Thames" data-item-external-name="London" data-item-id="1000">
          <p class="defra-flood-meta defra-flood-meta--no-border govuk-!-margin-bottom-0">
            <strong data-item-time>20 minutes ago</strong>
          </p>
          <p>The River Thames level at London was <span data-item-value>2.17</span> metres. Property flooding is possible when it goes above 4.00 metres.</p>
          <p>
            <a href="/station/1000">Monitor the latest level at London</a>
          </p>
        </div>

        <div class="defra-live__item" data-item-status="false" data-item-name="Sea Cut" data-item-external-name="Mowthorpe" data-item-id="2000">
          <p class="defra-flood-meta defra-flood-meta--no-border govuk-!-margin-bottom-0">
            <strong data-item-time>30 minutes ago</strong>
          </p>
          <p>The Sea Cut level at Mowthorpe was <span data-item-value>1.10</span> metres. Property flooding is possible when it goes above 2.00 metres.</p>
          <p>
            <a href="/station/2000">Monitor the latest level at Mowthorpe</a>
          </p>
        </div>
      </div>
    </div>
    `
    const dom = new JSDOM(html, { url: 'http://localhost' })
    window = dom.window
    document = window.document

    global.DOMParser = window.DOMParser
    global.document = document
    global.window = window

    require('../../../../server/src/js/components/latest-levels-auto-refresh.js')
  })

  beforeEach(() => {
    mockFetch = global.window.fetch = jest.spyOn(global, 'fetch')

    jest.useFakeTimers({ now: 0, doNotFake: ['nextTick', 'queueMicrotask'] })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize and update time ago correctly for multiple elements', () => {
    const ll = new window.LatestLevelsAutoRefresh()
    ll.renderTimeAgo()

    const elements = document.querySelectorAll('[data-item-time]')

    expect(elements[0].textContent).toBe('21 minutes ago')
    expect(elements[1].textContent).toBe('31 minutes ago')
    expect(ll.liveStatusMessages.length).toBe(0)
  })

  it('should fetch levels and update the DOM with the new values', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      json: () => ({
        severity: 'severe',
        levels: [
          {
            rloi_id: 1000,
            river_name: 'River Thames',
            external_name: 'London',
            latest_level: '0.10',
            threshold_value: '11.50',
            isSuspendedOrOffline: false,
            value_timestamp: '15 minutes ago'
          },
          {
            rloi_id: 2000,
            river_name: 'Sea Cut',
            external_name: 'Mowthorpe',
            latest_level: '0.20',
            threshold_value: '1.57',
            isSuspendedOrOffline: false,
            value_timestamp: '15 minutes ago'
          }
        ]
      })
    }))

    const ll = new window.LatestLevelsAutoRefresh()

    await new Promise((resolve, reject) => {
      ll.fetchRiverLevels(() => {
        try {
          const elements = document.querySelectorAll('.defra-live__item')

          expect(elements[0].querySelector('[data-item-time]').textContent).toBe('15 minutes ago')
          expect(elements[0].querySelector('[data-item-value]').textContent).toBe('0.10')
          expect(ll.liveStatusMessages.length).toBe(2)
          expect(ll.liveStatusMessages[0]).toBe('The River Thames at London level was 0.10 metres 15 minutes ago')
          expect(ll.liveStatusMessages[1]).toBe('The Sea Cut at Mowthorpe level was 0.20 metres 15 minutes ago')

          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  })

  it('should flag "hasChanges" as "false" when there are no changes', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      json: () => ({
        severity: 'severe',
        levels: [
          {
            rloi_id: 1000,
            river_name: 'River Thames',
            external_name: 'London',
            latest_level: '0.10',
            threshold_value: '2.17',
            isSuspendedOrOffline: false,
            value_timestamp: '15 minutes ago'
          },
          {
            rloi_id: 2000,
            river_name: 'Sea Cut',
            external_name: 'Mowthorpe',
            latest_level: '0.20',
            threshold_value: '1.10',
            isSuspendedOrOffline: false,
            value_timestamp: '15 minutes ago'
          }
        ]
      })
    }))

    const ll = new window.LatestLevelsAutoRefresh()

    await new Promise((resolve, reject) => {
      ll.fetchRiverLevels(() => {
        try {
          expect(ll.hasChanges).toEqual(false)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  })

  it('should fetch data via retry', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      json: () => ({
        severity: 'severe',
        levels: [
          {
            rloi_id: 1000,
            river_name: 'River Thames',
            external_name: 'London',
            latest_level: '0.10',
            threshold_value: '2.17',
            isSuspendedOrOffline: false,
            value_timestamp: '15 minutes ago'
          },
          {
            rloi_id: 2000,
            river_name: 'Sea Cut',
            external_name: 'Mowthorpe',
            latest_level: '0.20',
            threshold_value: '1.10',
            isSuspendedOrOffline: false,
            value_timestamp: '15 minutes ago'
          }
        ]
      })
    }))

    const ll = new window.LatestLevelsAutoRefresh()

    ll.retry()

    expect(ll.hasChanges).toEqual(null)
  })

  it('should set accessibility message when there are missing elements fetched', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      json: () => ({
        severity: 'severe',
        levels: [
          {
            rloi_id: 1000,
            river_name: 'River Thames',
            external_name: 'London',
            latest_level: '0.10',
            threshold_value: '11.50',
            isSuspendedOrOffline: false,
            value_timestamp: '15 minutes ago'
          }
        ]
      })
    }))

    const ll = new window.LatestLevelsAutoRefresh()

    await ll.fetchRiverLevels()

    expect(ll.liveStatusMessages).toEqual(['Warnings have been removed, please refresh the page.'])
  })

  describe('additional branches', () => {
    const itemHtml = (id = 1000, value = '2.17', time = '20 minutes ago') => `
      <div class="defra-live__item" data-item-id="${id}">
        <strong data-item-time>${time}</strong>
        <span data-item-value>${value}</span>
      </div>`

    const setBody = (inner, severity = 'severe') => {
      document.body.innerHTML = `
        <output data-live-status></output>
        <div class="defra-live" data-severity-status="${severity}">${inner}</div>`
    }

    const level = (overrides = {}) => ({
      rloi_id: 1000,
      river_name: 'River Thames',
      external_name: 'London',
      latest_level: '0.10',
      isSuspendedOrOffline: false,
      value_timestamp: '15 minutes ago',
      ...overrides
    })

    const mockResponse = (data) => mockFetch.mockResolvedValue({ json: () => data })

    it('updateLiveStatus should do nothing when there are no messages', () => {
      setBody(itemHtml())
      const ll = new window.LatestLevelsAutoRefresh()
      document.querySelector('[data-live-status]').innerHTML = '<p>existing</p>'

      ll.updateLiveStatus()

      expect(document.querySelector('[data-live-status]').innerHTML).toBe('<p>existing</p>')
    })

    it('updateLiveStatus should do nothing when the live status element is missing', () => {
      document.body.innerHTML = itemHtml()
      const ll = new window.LatestLevelsAutoRefresh()
      ll.liveStatusMessages = ['message']

      expect(() => ll.updateLiveStatus()).not.toThrow()
    })

    it('updateLiveStatus should replace the live status content with the joined messages', () => {
      setBody(itemHtml())
      const ll = new window.LatestLevelsAutoRefresh()
      const element = document.querySelector('[data-live-status]')
      element.innerHTML = '<span>old</span>'
      ll.liveStatusMessages = ['first', 'second']

      ll.updateLiveStatus()

      expect(element.querySelectorAll('p')).toHaveLength(1)
      expect(element.querySelector('span')).toBeNull()
      expect(element.querySelector('p').innerText).toBe('first. second')
    })

    it('renderTimeAgo should switch to "More than 1 hour ago" after 59 minutes and then leave it alone', () => {
      setBody(itemHtml(1000, '2.17', '59 minutes ago'))
      const ll = new window.LatestLevelsAutoRefresh()
      const element = document.querySelector('[data-item-time]')

      ll.renderTimeAgo()
      expect(element.textContent).toBe('More than 1 hour ago')

      ll.renderTimeAgo()
      expect(element.textContent).toBe('More than 1 hour ago')
    })

    it('initializeTimeAgoUpdates should render at the next minute and then every minute', () => {
      setBody(itemHtml())
      const ll = new window.LatestLevelsAutoRefresh()
      const renderSpy = jest.spyOn(ll, 'renderTimeAgo').mockReturnValue(undefined)

      ll.initializeTimeAgoUpdates()

      jest.advanceTimersByTime(59999)
      expect(renderSpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      expect(ll.timeAgoInterval).not.toBeNull()

      jest.advanceTimersByTime(60000)
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    describe('renderRiverLevels', () => {
      let originalWindow

      beforeEach(() => {
        originalWindow = global.window
      })

      afterEach(() => {
        global.window = originalWindow
      })

      it('should reload the page when the severity has changed', () => {
        setBody(itemHtml(), 'warning')
        const ll = new originalWindow.LatestLevelsAutoRefresh()
        const reload = jest.fn()
        global.window = { location: { reload } }

        ll.renderRiverLevels({ severity: 'severe', levels: [level()] })

        expect(reload).toHaveBeenCalledOnce()
        expect(ll.liveStatusMessages).toBeEmpty()
      })

      it('should reload the page when there is no severity status element', () => {
        document.body.innerHTML = itemHtml()
        const ll = new originalWindow.LatestLevelsAutoRefresh()
        const reload = jest.fn()
        global.window = { location: { reload } }

        ll.renderRiverLevels({ severity: 'severe', levels: [level()] })

        expect(reload).toHaveBeenCalledOnce()
      })
    })

    it('renderRiverLevels should ask for a refresh when a station is suspended or offline', () => {
      setBody(itemHtml())
      const ll = new window.LatestLevelsAutoRefresh()

      ll.renderRiverLevels({ severity: 'severe', levels: [level({ isSuspendedOrOffline: true })] })

      expect(ll.liveStatusMessages).toEqual(['Please refresh the page'])
      expect(document.querySelector('[data-item-value]').textContent).toBe('2.17')
    })

    it('renderRiverLevels should ask for a refresh when a station element is missing from the page', () => {
      setBody(itemHtml(1000))
      const ll = new window.LatestLevelsAutoRefresh()

      ll.renderRiverLevels({ severity: 'severe', levels: [level({ rloi_id: 9999 })] })

      expect(ll.liveStatusMessages).toEqual(['Please refresh the page'])
    })

    it('fetchData should request the latest levels for the id in the current path', async () => {
      setBody(itemHtml())
      mockResponse({ severity: 'severe', levels: [] })
      window.history.pushState({}, '', '/target-area/011WAFDW')
      const ll = new window.LatestLevelsAutoRefresh()

      let data
      try {
        data = await ll.fetchData()
      } finally {
        window.history.pushState({}, '', '/')
      }

      expect(data).toEqual({ severity: 'severe', levels: [] })
      expect(mockFetch).toHaveBeenCalledExactlyOnceWith('/api/latest-levels/011WAFDW', { cache: 'no-store' })
    })

    it('fetchRiverLevels should record an error message when the fetch fails', async () => {
      setBody(itemHtml())
      mockFetch.mockRejectedValue(new Error('network'))
      const consoleSpy = jest.spyOn(console, 'error').mockReturnValue(undefined)
      const callback = jest.fn()
      const ll = new window.LatestLevelsAutoRefresh()

      await ll.fetchRiverLevels(callback)

      expect(callback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledOnce()
      expect(ll.liveStatusMessages).toEqual(['There was an error getting the latest level'])
      expect(document.querySelector('[data-live-status] p').innerText).toBe('There was an error getting the latest level')
    })

    it('fetchRiverLevels should work without a callback and not schedule a retry when levels changed', async () => {
      setBody(itemHtml())
      mockResponse({ severity: 'severe', levels: [level()] })
      const ll = new window.LatestLevelsAutoRefresh()
      const retrySpy = jest.spyOn(ll, 'retry').mockResolvedValue(undefined)

      await ll.fetchRiverLevels()
      jest.advanceTimersByTime(10000)

      expect(retrySpy).not.toHaveBeenCalled()
      expect(document.querySelector('[data-item-value]').textContent).toBe('0.10')
    })

    it('fetchRiverLevels should schedule a retry after 10 seconds when nothing changed', async () => {
      setBody(itemHtml(1000, '0.10'))
      mockResponse({ severity: 'severe', levels: [level()] })
      const ll = new window.LatestLevelsAutoRefresh()
      const retrySpy = jest.spyOn(ll, 'retry').mockResolvedValue(undefined)

      await ll.fetchRiverLevels()

      expect(ll.hasChanges).toBeFalse()
      jest.advanceTimersByTime(9999)
      expect(retrySpy).not.toHaveBeenCalled()
      jest.advanceTimersByTime(1)
      expect(retrySpy).toHaveBeenCalledOnce()
    })

    it('retry should render new levels and update the live status', async () => {
      setBody(itemHtml())
      mockResponse({ severity: 'severe', levels: [level()] })
      const ll = new window.LatestLevelsAutoRefresh()

      await ll.retry()

      expect(document.querySelector('[data-item-value]').textContent).toBe('0.10')
      expect(document.querySelector('[data-live-status] p').innerText).toBe('The River Thames at London level was 0.10 metres 15 minutes ago')
    })

    it('retry should record an error message when the fetch fails', async () => {
      setBody(itemHtml())
      mockFetch.mockRejectedValue(new Error('network'))
      const consoleSpy = jest.spyOn(console, 'error').mockReturnValue(undefined)
      const ll = new window.LatestLevelsAutoRefresh()

      await ll.retry()

      expect(consoleSpy).toHaveBeenCalledOnce()
      expect(ll.liveStatusMessages).toEqual(['There was an error retrying to get the latest level'])
    })

    it.each([
      ['the next target minute in the same hour', new Date(2024, 0, 1, 10, 5, 0), 14 * 60 * 1000],
      ['the first target minute of the next hour', new Date(2024, 0, 1, 10, 50, 0), 14 * 60 * 1000]
    ])('nextUpdate should schedule a fetch at %s', (_, now, expectedDelay) => {
      jest.setSystemTime(now)
      setBody(itemHtml())
      const ll = new window.LatestLevelsAutoRefresh()
      const fetchSpy = jest.spyOn(ll, 'fetchRiverLevels').mockResolvedValue(undefined)

      ll.nextUpdate()

      jest.advanceTimersByTime(expectedDelay - 1)
      expect(fetchSpy).not.toHaveBeenCalled()
      jest.advanceTimersByTime(1)
      expect(fetchSpy).toHaveBeenCalledOnce()
      expect(ll.timeout).not.toBeNull()
    })
  })
})
