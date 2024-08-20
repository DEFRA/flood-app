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

module.exports = getThresholdsForTargetArea
