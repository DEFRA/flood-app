function getMinFromType (arr, type) {
  const filtered = arr.filter(item => item.threshold_type === type)
  if (filtered.length) {
    return filtered.reduce((min, curr) => parseFloat(curr.value) < parseFloat(min.value) ? curr : min)
  }
  return null
}

function findMinValueByLogic (arr, type) {
  if (type === 'A') {
    // Logic for Type A
    return getMinFromType(arr, 'FW RES FAL') ||
      getMinFromType(arr, 'FW ACT FAL') ||
      getMinFromType(arr, 'FW ACTCON FAL')
  } else if (type === 'W') {
    // Logic for Type W
    return getMinFromType(arr, 'FW RES FW') ||
      getMinFromType(arr, 'FW ACT FW') ||
      getMinFromType(arr, 'FW ACTCON FW')
  } else {
    return null
  }
}

function filterImtdThresholds (imtdThresholds) {
  const typeA = imtdThresholds.filter(item => item.fwis_type === 'A')
  const typeW = imtdThresholds.filter(item => item.fwis_type === 'W')

  const minObjectA = findMinValueByLogic(typeA, 'A')
  const minObjectW = findMinValueByLogic(typeW, 'W')

  return {
    alert: minObjectA ? minObjectA.value : null,
    warning: minObjectW || null
  }
}

module.exports = filterImtdThresholds
