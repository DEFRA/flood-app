const SEVERE_FLOOD_WARNING_THRESHOLD = 3
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

  if (imtdThresholdAlert) {
    thresholds.push(imtdThresholdAlert)
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
    const warningType = imtdThresholds.warning.severity_value === SEVERE_FLOOD_WARNING_THRESHOLD
      ? 'Severe flood warning'
      : 'Flood warning'

    return {
      id: 'warningThreshold',
      description: imtdThresholds.warning.severity_value
        ? `${warningType} issued: <a href="/target-area/${imtdThresholds.warning.fwis_code}">${imtdThresholds.warning.ta_name}</a>`
        : 'Property flooding is possible above this level',
      shortname: imtdThresholds.warning.severity_value ? `${imtdThresholds.warning.ta_name}` : 'Possible flood warnings',
      value: imtdThresholdWarning
    }
  }

  return null
}

function calculateAlertThreshold (imtdThresholds, stationStageDatum, stationSubtract, postProcess, pc5) {
  const imtdThresholdAlert = processThreshold(imtdThresholds?.alert, stationStageDatum, stationSubtract, postProcess)

  if (imtdThresholdAlert) {
    return {
      id: 'alertThreshold',
      description: Number(imtdThresholdAlert) !== Number(pc5)
        ? 'Low lying land flooding possible above this level. One or more flood alerts may be issued'
        : 'Top of normal range. Low lying land flooding possible above this level. One or more flood alerts may be issued',
      shortname: 'Possible flood alerts',
      value: imtdThresholdAlert
    }
  }

  return null
}

module.exports = processImtdThresholds
