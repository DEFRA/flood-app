const { formatElapsedTime } = require('../../../util')

const WARNING_THRESHOLD_TYPES = ['FW RES FW', 'FW ACT FW', 'FW ACTCON FW']

function adjustThresholdValue (value, stageDatum, subtract, postProcess) {
  if (postProcess) {
    if (stageDatum && stageDatum > 0) {
      value -= stageDatum
    } else if (stageDatum <= 0 && subtract && subtract > 0) {
      value -= subtract
    } else {
      return parseFloat(value).toFixed(2)
    }
  }
  return parseFloat(value).toFixed(2)
}

function getThresholdsForTargetArea (thresholds) {
  const filteredThresholds = thresholds.filter(threshold =>
    threshold.status !== 'Closed' &&
    !(threshold.iswales && threshold.latest_level === null)
  )

  const warningThresholds = findPrioritisedThresholds(filteredThresholds, WARNING_THRESHOLD_TYPES)

  return warningThresholds.map(threshold => {
    threshold.formatted_time = formatElapsedTime(threshold.value_timestamp)
    threshold.isSuspendedOrOffline = threshold.status === 'Suspended' || (threshold.status === 'Active' && threshold.latest_level === null)

    // Use adjustThresholdValue for threshold_value adjustment
    threshold.threshold_value = adjustThresholdValue(
      threshold.threshold_value,
      threshold.stage_datum,
      threshold.subtract,
      threshold.post_process
    )

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
