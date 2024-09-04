const { formatElapsedTime } = require('../../../util')

const WARNING_THRESHOLD_TYPES = ['FW RES FW', 'FW ACT FW', 'FW ACTCON FW']

function getThresholdsForTargetArea (thresholds) {
  const filteredThresholds = thresholds.filter(threshold =>
    threshold.status !== 'Closed' &&
    !(threshold.iswales && threshold.latest_level === null)
  )

  const warningThresholds = findPrioritisedThresholds(filteredThresholds, WARNING_THRESHOLD_TYPES)
  return warningThresholds.map(threshold => {
    threshold.formatted_time = formatElapsedTime(threshold.value_timestamp)
    threshold.isSuspendedOrOffline = threshold.status === 'Suspended' || (threshold.status === 'Active' && threshold.latest_level === null)
    return threshold
  })
}

function findPrioritisedThresholds (thresholds, types) {
  const thresholdMap = {}

  for (const type of types) {
    for (const threshold of thresholds) {
      if (threshold.threshold_type === type && !thresholdMap[threshold.rloi_id]) {
        thresholdMap[threshold.rloi_id] = threshold
      }
    }
  }

  return Object.values(thresholdMap)
}

module.exports = getThresholdsForTargetArea
