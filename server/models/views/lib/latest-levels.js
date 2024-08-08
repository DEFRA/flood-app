const { formatElapsedTime } = require('../../../util')

const WARNING_THRESHOLD_TYPES = ['FW RES FW', 'FW ACT FW', 'FW ACTCON FW']

function getThresholdsForTargetArea (thresholds) {
  const warningThresholds = findPrioritizedThresholds(thresholds, WARNING_THRESHOLD_TYPES)
  return warningThresholds.map(formatThresholdTimestamp)
}

function findPrioritizedThresholds (thresholds, types) {
  const thresholdMap = new Map()

  for (const type of types) {
    const filteredThresholds = thresholds.filter(threshold => threshold.threshold_type === type)

    filteredThresholds.forEach(threshold => {
      if (!thresholdMap.has(threshold.rloi_id)) {
        thresholdMap.set(threshold.rloi_id, threshold)
      }
    })
  }

  return Array.from(thresholdMap.values())
}

function formatThresholdTimestamp (threshold) {
  if (threshold) {
    threshold.formatted_time = formatElapsedTime(threshold.value_timestamp)
  }
  return threshold
}

module.exports = getThresholdsForTargetArea
