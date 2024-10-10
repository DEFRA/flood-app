const { JSDOM } = require('jsdom')
const { expect } = require('@hapi/code')
const { script } = require('@hapi/lab')
const sinon = require('sinon')

const lab = script()
const { describe, it, before, afterEach } = lab
exports.lab = lab

const htmlNewUpdate = {
  ok: true,
  text: () => `
    <div class="defra-live" data-severity-status="3">
      <div class="defra-live__item" data-item-status="Active" data-item-name="River Thames" data-item-agency="London" data-item-id="1000">
        <p class="defra-flood-meta defra-flood-meta--no-border govuk-!-margin-bottom-0">
          <strong data-item-time>15 minutes ago</strong>
        </p>
        <p>The River Thames level at London was <span data-item-value>0.10</span> metres. Property flooding is possible when it goes above 4.00 metres.</p>
        <p>
          <a href="/station/1000">Monitor the latest level at London</a>
        </p>
      </div>

      <div class="defra-live__item" data-item-status="Active" data-item-name="Sea Cut" data-item-agency="Mowthorpe" data-item-id="2000">
        <p class="defra-flood-meta defra-flood-meta--no-border govuk-!-margin-bottom-0">
          <strong data-item-time>15 minutes ago</strong>
        </p>
        <p>The Sea Cut level at Mowthorpe was <span data-item-value>0.20</span> metres. Property flooding is possible when it goes above 2.00 metres.</p>
        <p>
          <a href="/station/2000">Monitor the latest level at Mowthorpe</a>
        </p>
      </div>
    </div>
  `
}

describe('latestLevels', () => {
  let window
  let document
  let clock
  let mockFetch

  before(() => {
    const html = `
      <output data-live-status></output>
      <div class="defra-live" data-severity-status="3">
        <div class="defra-live__item" data-item-status="Active" data-item-name="River Thames" data-item-agency="London" data-item-id="1000">
          <p class="defra-flood-meta defra-flood-meta--no-border govuk-!-margin-bottom-0">
            <strong data-item-time>20 minutes ago</strong>
          </p>
          <p>The River Thames level at London was <span data-item-value>2.17</span> metres. Property flooding is possible when it goes above 4.00 metres.</p>
          <p>
            <a href="/station/1000">Monitor the latest level at London</a>
          </p>
        </div>

        <div class="defra-live__item" data-item-status="Active" data-item-name="Sea Cut" data-item-agency="Mowthorpe" data-item-id="2000">
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

    mockFetch = global.window.fetch = sinon.stub(global, 'fetch')

    clock = sinon.useFakeTimers()

    require('../../../../server/src/js/components/latest-levels-auto-refresh.js')
  })

  afterEach(() => {
    clock.restore()
  })

  it('should initialize and update time ago correctly for multiple elements', () => {
    const ll = new window.LatestLevelsAutoRefresh()
    ll.renderTimeAgo()

    const elements = document.querySelectorAll('[data-item-time]')

    expect(elements[0].textContent).to.equal('21 minutes ago')
    expect(elements[1].textContent).to.equal('31 minutes ago')
    expect(ll.liveStatusMessages.length).to.equal(0)
  })

  it('should fetch levels and update the DOM with the new values', () => {
    mockFetch.returns(Promise.resolve(htmlNewUpdate))

    const ll = new window.LatestLevelsAutoRefresh()

    ll.fetchRiverLevels(() => {
      const elements = document.querySelectorAll('.defra-live__item')

      expect(elements[0].querySelector('[data-item-time]').textContent).to.equal('15 minutes ago')
      expect(elements[0].querySelector('[data-item-value]').textContent).to.equal('0.10')
      expect(ll.liveStatusMessages.length).to.equal(2)
      expect(ll.liveStatusMessages[0]).to.equal('The River Thames at London level was 0.10 metres 15 minutes ago')
      expect(ll.liveStatusMessages[1]).to.equal('The Sea Cut at Mowthorpe level was 0.20 metres 15 minutes ago')
    })
  })

  it('should set accessibility message when there are missing elements fetched', () => {
    mockFetch.returns(Promise.resolve({ ok: true, text: () => '<div class="defra-live"></div>' }))

    const ll = new window.LatestLevelsAutoRefresh()

    ll.fetchRiverLevels(() => {
      expect(ll.liveStatusMessages.length).to.equal(1)
      expect(ll.liveStatusMessages[0]).to.equal('Warnings have been removed, please refresh the page.')
    })
  })
})
