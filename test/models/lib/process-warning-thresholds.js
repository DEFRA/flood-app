const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const data = require('../../data')
const lab = exports.lab = Lab.script()
const processWarningThresholds = require('../../../server/models/views/lib/process-warning-thresholds')

// const warningExpectedText = { id: 'warningThreshold', description: 'Flood warning issued: <a href="/target-area/062FWF46Harpendn">River Lee at Harpenden</a>', shortname: 'River Lee at Harpenden' }

lab.experiment('process Warning thresholds test', () => {
  lab.test('check warning thresholds are created', async () => {
    const thresholds = processWarningThresholds(data.warnings)
    console.log(thresholds)
    Code.expect(thresholds.length).to.equal(4)
  })
  lab.test('check warning threshold text', async () => {
    const thresholds = processWarningThresholds(data.warnings)
    Code.expect(thresholds[0].description).to.equal('Flood warning issued: <a href="/target-area/062FWF46Harpendn">River Lee at Harpenden</a>')
    Code.expect(thresholds[0].shortname).to.equal('River Lee at Harpenden')
  })
  lab.test('check warning threshold value displays with 2 decimal places', async () => {
    const thresholds = processWarningThresholds(data.warnings)
    Code.expect(thresholds[0].value).to.equal('1.60')
  })
  lab.test('check severe warning threshold text', async () => {
    const thresholds = processWarningThresholds(data.warnings)
    Code.expect(thresholds[2].description).to.equal('Severe flood warning issued: <a href="/target-area/064FWF46York">River Ouse at York</a>')
    Code.expect(thresholds[2].shortname).to.equal('River Ouse at York')
  })
  lab.test('check severe warning threshold value with 2 decimal places', async () => {
    const thresholds = processWarningThresholds(data.warnings)
    Code.expect(thresholds[2].value).to.equal('1.70')
  })
  lab.test('check no warning thresholds is handled', async () => {
    const thresholds = processWarningThresholds([])
    Code.expect(thresholds).to.equal([])
  })
})
