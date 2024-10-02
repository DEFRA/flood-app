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

  const imtdThresholdWarning = processThreshold(imtdThresholds?.warning?.value, stationStageDatum, stationSubtract, postProcess)
  // Correct threshold value if value > zero (Above Ordnance Datum) [FSR-595]
  if (imtdThresholdWarning) {
    if (imtdThresholds.warning.severity_value) {
      const warningType = imtdThresholds.warning.severity_value === SEVERE_FLOOD_WARNING_THRESHOLD ? 'Severe Flood Warning' : 'Flood Warning'
      thresholds.push({
        id: 'warningThreshold',
        description: `${warningType} issued: <a href="/target-area/${imtdThresholds.warning.fwis_code}">${imtdThresholds.warning.ta_name}</a>`,
        shortname: 'Possible flood warnings',
        value: imtdThresholdWarning
      })
    } else {
      thresholds.push({
        id: 'warningThreshold',
        description: 'Property flooding is possible above this level',
        shortname: 'Possible flood warnings',
        value: imtdThresholdWarning
      })
    }
  }
  const imtdThresholdAlert = processThreshold(imtdThresholds?.alert, stationStageDatum, stationSubtract, postProcess)
  if (imtdThresholdAlert) {
    if (Number(imtdThresholdAlert) !== Number(pc5)) {
      thresholds.push({
        id: 'alertThreshold',
        description: 'Low lying land flooding possible above this level. One or more flood alerts may be issued',
        shortname: 'Possible flood alerts',
        value: imtdThresholdAlert
      })
    } else {
      thresholds.push({
        id: 'alertThreshold',
        description: Number(imtdThresholdAlert) === Number(pc5)
          ? 'Top of normal range. Low lying land flooding possible above this level. One or more flood alerts may be issued'
          : 'Top of normal range',
        shortname: 'Possible flood alerts',
        value: imtdThresholdAlert
      })
    }
  } else {
    if (pc5) {
      thresholds.push({
        id: 'pc5',
        description: 'Top of normal range. Low lying land flooding possible above this level',
        shortname: 'Top of normal range',
        value: pc5
      })
    }
  }
  return thresholds
}

module.exports = processImtdThresholds
