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

function processImtdThresholds (imtdThresholds, stationStageDatum, stationSubtract, postProcess) {
  const thresholds = []

  const imtdThresholdWarning = processThreshold(imtdThresholds?.warning, stationStageDatum, stationSubtract, postProcess)
  if (imtdThresholdWarning) {
    // Correct threshold value if value > zero (Above Ordnance Datum) [FSR-595]
    thresholds.push({
      id: 'warningThreshold',
      description: 'Property flooding is possible above this level. One or more flood warnings may be issued',
      shortname: 'Possible flood warnings',
      value: imtdThresholdWarning
    })
  }

  const imtdThresholdAlert = processThreshold(imtdThresholds?.alert, stationStageDatum, stationSubtract, postProcess)
  if (imtdThresholdAlert) {
    thresholds.push({
      id: 'alertThreshold',
      description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued',
      shortname: 'Possible flood alerts',
      value: imtdThresholdAlert
    })
  }
  return thresholds
}

module.exports = {
  processImtdThresholds,
  processThreshold
}
