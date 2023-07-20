const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const mockdate = require('mockdate')

const telemetryFixture = require('../../../data/telemetry.json')
const { cleanupDOM, setupDOM } = require('../../../dom')

const { experiment, test, before, after, beforeEach } = exports.lab = Lab.script()

experiment('BarChart', () => {
  before(async () => {
    setupDOM()
    mockdate.set('2023-07-19T00:00:00.000Z')
    await import('../../../../server/src/js/core.mjs')
    await import('../../../../server/src/js/components/bar-chart/index.mjs')
  })

  after(() => {
    cleanupDOM()
    mockdate.reset()
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('The hours and minutes controls are rendered with hours as the default', async () => {
    // Arrange
    const chartId = 'example-chart-id'
    const telemetry = telemetryFixture
    const chartContainer = document.createElement('div')
    chartContainer.setAttribute('id', 'bar-chart-container')
    document.body.appendChild(chartContainer)

    // Act
    window.flood.charts.createBarChart('bar-chart-container', chartId, telemetry)
    const controlsContainer = chartContainer.querySelector('.defra-chart-segmented-control')
    const controls = [...controlsContainer.children]

    // Assert
    expect(controlsContainer).not.to.equal(null)
    expect(controls).to.have.length(2)

    expect([...controls[0].classList]).to.equal([
      'defra-chart-segmented-control__segment',
      'defra-chart-segmented-control__segment--selected'
    ])
    expect(controls[0].children[1].textContent).to.equal('Hours')
    expect({ ...controls[0].children[0].dataset }).to.equal({
      period: 'hours',
      start: '2023-07-14T00:00:00Z',
      end: '2023-07-19T00:00:00Z'
    })

    expect([...controls[1].classList]).to.equal([
      'defra-chart-segmented-control__segment'
    ])
    expect(controls[1].children[1].textContent).to.equal('Minutes')
    expect({ ...controls[1].children[0].dataset }).to.equal({
      period: 'minutes',
      start: '2023-07-18T00:00:00Z',
      end: '2023-07-19T00:00:00Z'
    })
  })

  test('The minutes control switches the chart to 24 hour range', async () => {
    // Arrange
    const chartId = 'example-chart-id'
    const telemetry = telemetryFixture
    const chartContainer = document.createElement('div')
    chartContainer.setAttribute('id', 'bar-chart-container')
    document.body.appendChild(chartContainer)
    window.flood.charts.createBarChart('bar-chart-container', chartId, telemetry)
    const [hoursControl, minutesControl] = chartContainer.querySelector('.defra-chart-segmented-control').children

    // Act
    minutesControl.children[0].click()

    // Assert
    expect([...minutesControl.classList]).to.equal([
      'defra-chart-segmented-control__segment',
      'defra-chart-segmented-control__segment--selected'
    ])
    expect([...hoursControl.classList]).to.equal([
      'defra-chart-segmented-control__segment'
    ])
  })
})
