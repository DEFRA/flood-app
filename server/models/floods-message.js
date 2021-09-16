module.exports = (floods, isLocalised) => {
  const severeWarnings = floods.groups[0].count
  const warnings = floods.groups[1].count
  const alerts = floods.groups[2].count
  const all = severeWarnings + warnings + alerts
  const text = getText(all, isLocalised)
  const counts = getCounts(all, severeWarnings, warnings, alerts)
  return text.replace('$counts', counts)
}

const getText = (all, isLocalised) => `There ${all === 1 ? 'is' : 'are'} currently $counts in force${isLocalised ? ' at this location' : ''}.`

const getCounts = (all, severeWarnings, warnings, alerts) => {
  let counts = ''
  if (all === 0) {
    counts = 'no flood warnings or alerts'
  } else {
    if (severeWarnings > 0) {
      counts += getSevereWarnings(severeWarnings)
    }
    if (warnings > 0) {
      if (counts.length > 0) {
        counts += `${alerts > 0 ? ', ' : ' and '}`
      }
      counts += getWarnings(warnings)
    }
    if (alerts > 0) {
      if (counts.length > 0) {
        counts += ' and '
      }
      counts += getAlerts(alerts)
    }
  }
  return counts
}

const getSevereWarnings = (severeWarnings) => `${severeWarnings === 1 ? 'one' : severeWarnings} severe flood warning${severeWarnings > 1 ? 's' : ''}`
const getWarnings = (warnings) => `${warnings === 1 ? 'one' : warnings} flood warning${warnings > 1 ? 's' : ''}`
const getAlerts = (alerts) => `${alerts === 1 ? 'one' : alerts} flood alert${alerts > 1 ? 's' : ''}`
