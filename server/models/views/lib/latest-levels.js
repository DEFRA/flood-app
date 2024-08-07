const { formatElapsedTime } = require('../../../util')

const WARNING_THRESHOLD_TYPES = ['FW RES FW', 'FW ACT FW', 'FW ACTCON FW']

function getThresholdsForTargetArea (thresholds) {
  const warningThreshold = findMinimumThreshold(thresholds, WARNING_THRESHOLD_TYPES)
  return {
    warning: formatThresholdTimestamp(warningThreshold)
  }
}

function findMinimumThreshold (thresholds, types) {
  let selectedThreshold = null

  for (const type of types) {
    const filteredThresholds = thresholds.filter(threshold => threshold.threshold_type === type)
    if (filteredThresholds.length > 0) {
      selectedThreshold = filteredThresholds.reduce((min, current) => {
        return (min === null || parseFloat(current.value) < parseFloat(min.value)) ? current : min
      }, selectedThreshold)
    }
    if (selectedThreshold) break
  }

  return selectedThreshold
}

function formatThresholdTimestamp (threshold) {
  if (threshold) {
    threshold.formatted_time = formatElapsedTime(threshold.value_timestamp)
  }
  return threshold
}

module.exports = getThresholdsForTargetArea
