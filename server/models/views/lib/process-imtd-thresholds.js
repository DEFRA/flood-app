function processThreshold (threshold, stationStageDatum, stationSubtract, postProcess) {
  if (threshold) {
    if (postProcess) {
      if (stationStageDatum > 0) {
        threshold = threshold - stationStageDatum
      } else if (stationStageDatum <= 0 && stationSubtract > 0) {
        threshold = threshold - stationSubtract
      } else {
        return parseFloat(threshold).toFixed(2)
      }
    }
    return parseFloat(threshold).toFixed(2)
  }
  return null
}

function processImtdThresholds (imtdThresholds, stationStageDatum, stationSubtract, postProcess, pc5) {
  const thresholds = []

  const imtdThresholdWarning = calculateWarningThreshold(imtdThresholds, stationStageDatum, stationSubtract, postProcess)
  const imtdThresholdAlert = calculateAlertThreshold(imtdThresholds, stationStageDatum, stationSubtract, postProcess, pc5)

  if (imtdThresholdWarning) {
    thresholds.push(imtdThresholdWarning)
  }

  if (imtdThresholdAlert.length > 0) {
    thresholds.push(...imtdThresholdAlert)
  } else if (pc5) {
    thresholds.push({
      id: 'pc5',
      description: 'Top of normal range. Low lying land flooding possible above this level',
      shortname: 'Top of normal range',
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
        shortname: 'Top of normal range',
        value: imtdThresholdAlert
      })
    } else {
      imtdThresholdAlerts.push({
        id: 'alertThreshold',
        description: 'Top of normal range',
        shortname: 'Top of normal range',
        value: imtdThresholdAlert
      })
    }
  }

  return imtdThresholdAlerts
}

module.exports = processImtdThresholds
