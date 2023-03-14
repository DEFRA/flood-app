
function processThreshold (threshold, stationStageDatum, stationSubtract, postProcess) {
  if (threshold) {
    if (postProcess) {
      if (stationStageDatum > 0) {
        threshold = threshold - stationStageDatum
      } else if (stationStageDatum <= 0 && stationSubtract > 0) {
        threshold = threshold - stationSubtract
      }
    }
    return {
      value: parseFloat(threshold).toFixed(2),
      valueImtd: threshold || 'n/a'
    }
  }
  return null
}

function processImtdThresholds (imtdThresholds, stationStageDatum, stationSubtract, postProcess) {
  const thresholds = []

  const imtdThresholdAlert = processThreshold(imtdThresholds?.alert, stationStageDatum, stationSubtract, postProcess)
  if (imtdThresholdAlert) {
    // this.alertThreshold = parseFloat(imtdThresholdAlert).toFixed(2)
    thresholds.push({
      id: 'alertThreshold',
      description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued',
      shortname: 'Possible flood alerts',
      ...imtdThresholdAlert
    })
  }

  const imtdThresholdWarning = processThreshold(imtdThresholds?.warning, stationStageDatum, stationSubtract, postProcess)
  if (imtdThresholdWarning) {
    // Correct threshold value if value > zero (Above Ordnance Datum) [FSR-595]
    // this.warningThreshold = parseFloat(imtdThresholdWarning).toFixed(2)
    thresholds.push({
      id: 'warningThreshold',
      description: 'Property flooding is possible above this level. One or more flood warnings may be issued',
      shortname: 'Possible flood warnings',
      ...imtdThresholdWarning
    })
  }
  return thresholds
}

module.exports = processImtdThresholds
