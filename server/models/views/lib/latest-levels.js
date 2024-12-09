const { formatElapsedTime } = require('../../../util')
const processThreshold = require('./process-threshold') // Import processThreshold from the module

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

    // Use processThreshold for threshold_value adjustment
    threshold.threshold_value = processThreshold(
      threshold.threshold_value,
      threshold.stage_datum,
      threshold.subtract,
      threshold.post_process
    )

    return threshold
  })
}
function findPrioritisedThresholds(thresholds, types) {
  const thresholdMap = thresholds.reduce((acc, threshold) => {
    if (types.includes(threshold.threshold_type)) {
      acc[threshold.rloi_id] = acc[threshold.rloi_id] || []
      if (!acc[threshold.rloi_id].some(t => t.direction === threshold.direction)) {
        acc[threshold.rloi_id].push(threshold)
      }
    }
    return acc
  }, {})

  return Object.values(thresholdMap).flat()
}

module.exports = getThresholdsForTargetArea
