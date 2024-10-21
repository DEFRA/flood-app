const { processThreshold } = require('./process-imtd-thresholds')

const FLOOD_WARNING_THRESHOLD = 2
const SEVERE_FLOOD_WARNING_THRESHOLD = 3
function filterThresholdsBySeverity (thresholds) {
  return thresholds.filter(item =>
    item.fwis_type === 'W' &&
    item.severity_value !== null &&
    (item.severity_value === FLOOD_WARNING_THRESHOLD || item.severity_value === SEVERE_FLOOD_WARNING_THRESHOLD)
  )
}

function getMaxForEachFwisCode (thresholds) {
  const maxValuesByFwisCode = {}

  thresholds.forEach(threshold => {
    const fwisCode = threshold.fwis_code
    const severityValue = threshold.severity_value
    const thresholdValue = threshold.value

    // Check if there's already a threshold for this fwis_code
    if (!maxValuesByFwisCode[fwisCode]) {
      // If it's the first threshold for this fwis_code, store it
      maxValuesByFwisCode[fwisCode] = threshold
    } else {
      const currentMax = maxValuesByFwisCode[fwisCode]

      // Compare based on severity_value first, or if severity_value is the same, compare based on the threshold value
      if (severityValue > currentMax.severity_value ||
          (severityValue === currentMax.severity_value && parseFloat(thresholdValue) > parseFloat(currentMax.value))) {
        maxValuesByFwisCode[fwisCode] = threshold
      }
    }
  })

  return Object.values(maxValuesByFwisCode)
}

function createWarningObject (threshold, stationStageDatum, stationSubtract, postProcess) {
  const warningType =
    threshold.severity_value === SEVERE_FLOOD_WARNING_THRESHOLD
      ? 'Severe flood warning'
      : 'Flood warning'

  const imtdThresholdWarning = processThreshold(parseFloat(threshold.threshold_value).toFixed(2), stationStageDatum, stationSubtract, postProcess)

  return {
    id: 'warningThreshold',
    description: `${warningType} issued: <a href="/target-area/${threshold.fwis_code}">${threshold.ta_name}</a>`,
    shortname: `${threshold.ta_name}`,
    value: imtdThresholdWarning
  }
}
function processWarningThresholds (imtdThresholds, stationStageDatum, stationSubtract, postProcess) {
  const filteredThresholds = filterThresholdsBySeverity(imtdThresholds)
  const maxThresholdsByFwisCode = getMaxForEachFwisCode(filteredThresholds)

  const warningObjects = maxThresholdsByFwisCode.map(threshold =>
    createWarningObject(threshold, stationStageDatum, stationSubtract, postProcess)
  )

  return warningObjects
}

module.exports = processWarningThresholds
