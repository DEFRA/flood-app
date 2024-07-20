// const Lab = require('@hapi/lab')
// const { expect } = require('@hapi/code')
// const mockdate = require('mockdate')

// const telemetryFixture = require('../../../data/telemetry.json')
// const { cleanupDOM, setupDOM } = require('../../../dom.js')

// const { experiment, test, before, after, beforeEach } = exports.lab = Lab.script()
// const initialTimezone = process.env.TZ
// experiment('BarChart', () => {
//   before(async () => {
//     setupDOM()
//     process.env.TZ = 'Etc/UTC'
//     mockdate.set('2023-07-19T00:00:00.000Z')
//     await import('../../../../server/src/js/core.js')
//     await import('../../../../server/src/js/components/chart.js')
//   })

//   after(() => {
//     process.env.TZ = initialTimezone
//     cleanupDOM()
//     mockdate.reset()
//   })

//   beforeEach(() => {
//     document.body.innerHTML = ''
//   })

//   test('The hours and minutes controls are rendered with hours as the default', async () => {
//     // Arrange
//     const chartId = 'example-chart-id'
//     const telemetry = telemetryFixture
//     const chartContainer = document.createElement('div')
//     chartContainer.setAttribute('id', 'bar-chart-container')
//     document.body.appendChild(chartContainer)

//     // Act
//     window.flood.charts.createBarChart('bar-chart-container', chartId, telemetry)
//     const controlsContainer = chartContainer.querySelector('.defra-chart-controls__group--resolution')
//     const [fiveDaysControl, twentyFourHoursControl] = controlsContainer.children

//     // Assert
//     expect(controlsContainer).not.to.equal(null)
//     expect(controlsContainer.children).to.have.length(2)

//     expect(fiveDaysControl.children[0].innerText).to.equal('5 days')
//     expect({ ...fiveDaysControl.dataset }).to.equal({
//       period: 'hours',
//       start: '2023-07-14T00:00:00Z',
//       end: '2023-07-19T00:00:00Z'
//     })

//     expect(twentyFourHoursControl.children[0].innerText).to.equal('24 hours')
//     expect({ ...twentyFourHoursControl.dataset }).to.equal({
//       period: 'minutes',
//       start: '2023-07-18T00:00:00Z',
//       end: '2023-07-19T00:00:00Z'
//     })

//     const description = chartContainer.querySelector('#bar-chart-description').textContent
//     expect(description).to.contain('Showing 5 days')
//     expect(description).to.contain('from 14 July 2023 at 1:00AM to 18 July 2023 at 3:00PM in hourly totals.')
//   })

//   test('The 24 hours control switches the chart to 24 hour range', async () => {
//     // Arrange
//     const chartId = 'example-chart-id'
//     const telemetry = telemetryFixture
//     const chartContainer = document.createElement('div')
//     chartContainer.setAttribute('id', 'bar-chart-container')
//     document.body.appendChild(chartContainer)
//     window.flood.charts.createBarChart('bar-chart-container', chartId, telemetry)
//     const twentyFourHoursControl = chartContainer.querySelector('.defra-chart-controls__group--resolution').children[1]

//     // Act
//     twentyFourHoursControl.click()

//     // Assert
//     const description = chartContainer.querySelector('#bar-chart-description').textContent
//     expect(description).to.contain('Showing 24 hours')
//     expect(description).to.contain('from 18 July 2023 at 12:15AM to 18 July 2023 at 2:45PM in 15 minute totals.')
//   })

//   test('The pagination buttons are shown when the chart is in the 24 hour range', async () => {
//     // Arrange
//     const chartId = 'example-chart-id'
//     const telemetry = telemetryFixture
//     const chartContainer = document.createElement('div')
//     chartContainer.setAttribute('id', 'bar-chart-container')
//     document.body.appendChild(chartContainer)

//     // Act
//     window.flood.charts.createBarChart('bar-chart-container', chartId, telemetry)
//     chartContainer.querySelector('.defra-chart-controls__group--resolution .defra-chart-controls__button[data-period="minutes"]').click()

//     // Assert
//     const outerContainer = document.querySelector('.defra-chart-controls__group--pagination')
//     expect(outerContainer).not.to.equal(null)
//     expect(outerContainer.style.display).to.equal('inline-block')
//     expect(outerContainer.children).to.have.length(2)

//     expect(outerContainer.children[0].dataset.direction).to.equal('back')
//     expect(outerContainer.children[1].dataset.direction).to.equal('forward')
//   })

//   test('The pagination buttons are not shown when the chart is in the 5 day range', async () => {
//     // Arrange
//     const chartId = 'example-chart-id'
//     const telemetry = telemetryFixture
//     const chartContainer = document.createElement('div')
//     chartContainer.setAttribute('id', 'bar-chart-container')
//     document.body.appendChild(chartContainer)

//     // Act
//     window.flood.charts.createBarChart('bar-chart-container', chartId, telemetry)
//     chartContainer.querySelector('.defra-chart-controls__group--resolution .defra-chart-controls__button[data-period="hours"]').click()

//     // Assert
//     const paginationControls = document.querySelector('.defra-chart-controls__group--pagination')
//     expect(paginationControls).not.to.equal(null)
//     expect(paginationControls.style.display).to.equal('none')
//   })

//   test('The pagination buttons allow changing the page range', async () => {
//     // Arrange
//     const chartId = 'example-chart-id'
//     const telemetry = telemetryFixture
//     const chartContainer = document.createElement('div')
//     chartContainer.setAttribute('id', 'bar-chart-container')
//     document.body.appendChild(chartContainer)

//     // Act
//     window.flood.charts.createBarChart('bar-chart-container', chartId, telemetry)
//     chartContainer.querySelector('.defra-chart-controls__group--resolution .defra-chart-controls__button[data-period="minutes"]').click()
//     chartContainer.querySelector('.defra-chart-controls__group--pagination .defra-chart-controls__button[data-direction="back"]').click()

//     // Assert
//     const description = chartContainer.querySelector('#bar-chart-description').textContent
//     expect(description).to.contain('Showing 24 hours')
//     expect(description).to.contain('from 17 July 2023 at 12:15AM to 18 July 2023 at 12:15AM in 15 minute totals')
//   })
// })
