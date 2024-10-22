const processThreshold = require('./process-threshold')

const TOP_OF_NORMAL_RANGE = 'Top of normal range'

function processImtdThresholds (imtdThresholds, stationStageDatum, stationSubtract, postProcess, pc5) {
  const thresholds = []

  const imtdThresholdWarning = calculateWarningThreshold(imtdThresholds, stationStageDatum, stationSubtract, postProcess)
  const imtdThresholdAlert = calculateAlertThreshold(imtdThresholds, stationStageDatum, stationSubtract, postProcess, pc5)

  if (imtdThresholdWarning) {
    thresholds.push(imtdThresholdWarning)
  }

  if (imtdThresholdAlert.length > 0) {
    for (const alert of imtdThresholdAlert) {
      thresholds.push(alert)
    }
  } else if (pc5) {
    thresholds.push({
      id: 'pc5',
      description: 'Top of normal range. Low lying land flooding possible above this level',
      shortname: TOP_OF_NORMAL_RANGE,
      value: pc5
    })
  } else { return thresholds }

  return thresholds
}

function calculateWarningThreshold (imtdThresholds, stationStageDatum, stationSubtract, postProcess) {
  const imtdThresholdWarning = processThreshold(imtdThresholds?.warning?.value, stationStageDatum, stationSubtract, postProcess)

  if (imtdThresholdWarning) {
    return {
      id: 'warningThreshold',
      description: 'Property flooding is possible above this level',
      shortname: 'Possible flood warnings',
      value: imtdThresholdWarning
    }
  }

  return null
}

function calculateAlertThreshold (imtdThresholds, stationStageDatum, stationSubtract, postProcess, pc5) {
  const imtdThresholdAlert = processThreshold(imtdThresholds?.alert, stationStageDatum, stationSubtract, postProcess)
  const imtdThresholdAlerts = []
  if (imtdThresholdAlert) {
  // First condition: if imtdThresholdAlert is not equal to Top of Normal Range (pc5)
    if (Number(imtdThresholdAlert) !== Number(pc5)) {
      imtdThresholdAlerts.push({
        id: 'alertThreshold',
        description: 'Low lying land flooding possible above this level. One or more flood alerts may be issued',
        shortname: 'Possible flood alerts',
        value: imtdThresholdAlert
      })
    }
    // Second condition: if imtdThresholdAlert is equal to Top of Normal Range (pc5)
    if (Number(imtdThresholdAlert) === Number(pc5)) {
      imtdThresholdAlerts.push({
        id: 'alertThreshold',
        description: 'Top of normal range. Low lying land flooding possible above this level. One or more flood alerts may be issued',
        shortname: TOP_OF_NORMAL_RANGE,
        value: imtdThresholdAlert
      })
    } else if (Number(pc5)) {
      imtdThresholdAlerts.push({
        id: 'pc5',
        description: TOP_OF_NORMAL_RANGE,
        shortname: TOP_OF_NORMAL_RANGE,
        value: parseFloat(Number(pc5)).toFixed(2)
      })
    } else {
      return imtdThresholdAlerts
    }
  }

  return imtdThresholdAlerts
}

module.exports = processImtdThresholds
