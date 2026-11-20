const data = require('../../data')
const processWarningThresholds = require('../../../server/models/views/lib/process-warning-thresholds')

describe('Model/Lib - Process Warning Thresholds', () => {
  it('should return correct number of warning thresholds', async () => {
    const thresholds = processWarningThresholds(data.warnings)

    expect(thresholds.length).toBe(4)
  })

  it('should return correct warning threshold text', async () => {
    const thresholds = processWarningThresholds(data.warnings)

    expect(thresholds[0].description).toBe('Flood warning issued: <a href="/target-area/062FWF46Harpendn">River Lee at Harpenden</a>')
    expect(thresholds[0].shortname).toBe('River Lee at Harpenden')
  })

  it('should set warning threshold value to 2 decimal places', async () => {
    const thresholds = processWarningThresholds(data.warnings)

    expect(thresholds[0].value).toBe('1.60')
  })

  it('should return severe warning threshold text', async () => {
    const thresholds = processWarningThresholds(data.warnings)

    expect(thresholds[2].description).toBe('Severe flood warning issued: <a href="/target-area/064FWF46York">River Ouse at York</a>')
    expect(thresholds[2].shortname).toBe('River Ouse at York')
  })

  it('should set severe warning threshold value to 2 decimal places', async () => {
    const thresholds = processWarningThresholds(data.warnings)
    expect(thresholds[2].value).toBe('1.70')
  })

  it('should return only the highest warning with multiple thresholds', async () => {
    const thresholds = processWarningThresholds(data.warnings)

    expect(thresholds[3].value).toBe('1.70')
  })

  it('should return no warning thresholds', async () => {
    const thresholds = processWarningThresholds([])

    expect(thresholds).toBeEmpty()
    expect(thresholds).toBeArray(0)
  })
})
