const processThreshold = (threshold, stationStageDatum, stationSubtract, postProcess) => {
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

module.exports = processThreshold
