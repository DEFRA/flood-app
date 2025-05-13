const { toFixed, formatElapsedTime } = require('../../../util')
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

    threshold.isGroundwater = threshold.station_type?.toLowerCase() === 'g'
    threshold.isCoastal = threshold.station_type?.toLowerCase() === 'c'

    let riverName = threshold.river_name

    if (threshold.isGroundwater) {
      riverName = 'Groundwater'
    }

    if (threshold.isCoastal && riverName === 'Sea Levels') {
      riverName = 'Sea'
    }

    threshold.river_name = riverName
    threshold.latest_level = toFixed(threshold.latest_level, 2)
    threshold.threshold_value = toFixed(threshold.threshold_value, 2)

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
