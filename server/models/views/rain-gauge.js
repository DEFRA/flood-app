const moment = require('moment-timezone')

function Graph (period, endTime, values, threshold, verticalAxisMax = 0) {
  // End time on horizontal axis
  // var end = moment('2019-02-18T15:00:00Z')

  // Hourly intervals over 24 hours
  var end = moment(endTime).subtract(moment(endTime).minute(), 'minutes')
  var startTime = end.subtract(23, 'hours')

  // 15 minute intervals over 6 hours
  if (period === 'minutes') {
    startTime = moment(endTime).subtract(5, 'hours').subtract(45, 'minutes')
  }

  // Daily intervals over 28 days
  if (period === 'days') {
    startTime = moment(endTime).subtract(27, 'days')
  }

  // Axis config
  var vMaxValue = Math.max.apply(Math, values) // Vertical axis max from values rounded up to nearest tick value
  if (period === 'minutes') {
    vMaxValue = vMaxValue + 2 - (vMaxValue % 2)
  } else if (period === 'hours') {
    vMaxValue = vMaxValue + 10 - (vMaxValue % 10)
  } else if (period === 'days') {
    vMaxValue = vMaxValue + 50 - (vMaxValue % 50)
  }
  vMaxValue = vMaxValue.toFixed(0)

  // Horizontal config
  var hTickFirstOffset = 2
  var hTickIncrement = 3
  var hTickPercentile = 100 / values.length

  // Extend vertical axis for fixed upper value
  if (vMaxValue < verticalAxisMax) {
    vMaxValue = verticalAxisMax
  }

  // Extend vertical axis for threshold rounded up
  if (vMaxValue < threshold) {
    if (period === 'minutes') {
      vMaxValue = (threshold + 2 - (threshold % 2))
    } else if (period === 'hours') {
      vMaxValue = (threshold + 10 - (threshold % 10))
    } else if (period === 'days') {
      vMaxValue = (threshold + 50 - (threshold % 50))
    }
  }

  // Calculate tick values and counts
  /*
  var vTickValue = Math.ceil((vMaxValue) / 5) // Vertical tick value
  var vTicksCount = Math.floor(vMaxValue / vTickValue) // Number of vertical ticks
  */
  var vTickValue = 0
  var vTicksCount = 1
  if (period === 'minutes') {
    vTickValue = 2
    vTicksCount += vMaxValue / 2
  } else if (period === 'hours') {
    vTickValue = 10
    vTicksCount += vMaxValue / 10
  } else if (period === 'days') {
    vTickValue = 50
    vTicksCount += vMaxValue / 50
  }

  // Extend vertical axis if max value does not fall on a tick
  /*
  if (vTickValue * vTicksCount < vMaxValue) {
    vTicksCount++
    vMaxValue = vTicksCount * vTickValue
  }
  */

  // Add one extra vertical tick
  // vTicksCount++ // Added for 0 tick

  // Calculate percentage spacing for each tick
  var vTickPercentile = ((100 / vMaxValue) * vTickValue).toFixed(2)

  // Generate records
  var columns = []
  for (var i = 0; i < values.length; i++) {
    var column = {
      timestamp: startTime.format(),
      period: period === 'days' ? startTime.format('DD/MM') : startTime.format('HH:mm'),
      value: values[i],
      vPercentile: ((100 / vMaxValue) * values[i]).toFixed(2),
      hPercentile: (i * hTickPercentile).toFixed(2),
      hWidthPercentile: hTickPercentile.toFixed(2),
      isTick: false
    }
    if ((i + hTickFirstOffset) % hTickIncrement === 0) {
      // THis is also an hTick tick
      column.isTick = true
    }
    columns.push(column)
    if (period === 'minutes') {
      startTime.add(15, 'minutes')
    } else if (period === 'hours') {
      startTime.add(1, 'hours')
    } else if (period === 'days') {
      startTime.add(1, 'day')
    }
  }

  // Calculate threshold height
  var thresholdPercentile = threshold > 0 ? ((100 / vMaxValue) * threshold).toFixed(2) : -1

  // Graph object
  return {
    columns: columns,
    vMaxValue: vMaxValue,
    vTickValue: vTickValue,
    vTicksCount: vTicksCount,
    vTickPercentile: vTickPercentile,
    threshold: (threshold > 0) ? threshold : '',
    thresholdPercentile: (thresholdPercentile > 0) ? thresholdPercentile : ''
  }
}

class ViewModel {
  constructor (rainGauge, rainMeasures) {
    // Static gauge properties
    this.name = rainGauge.items.label
    this.gridRef = rainGauge.items.gridReference
    this.coordinates = [rainGauge.items.long, rainGauge.items.lat]
    //
    // 6 hour data
    //
    const endDateMinutes = rainMeasures.items[0].dateTime // Start from latest entry
    const measuresMinutes = rainMeasures.items.slice(0, 24).map(a => a.value).reverse() // reversed for display
    this.graphMinutes = new Graph(
      'minutes',
      new Date(endDateMinutes),
      measuresMinutes,
      5,
      10 // Multiples of 2
    )
    //
    // 1 day data
    //
    var endDateHours
    var measuresHours = []
    var startIndex = -1
    // Set start index and endDate
    for (startIndex = 0; startIndex < 4; startIndex++) {
      if (moment(rainMeasures.items[startIndex].dateTime).minute() === 0) {
        endDateHours = rainMeasures.items[startIndex].dateTime
        break
      }
    }
    // Iterate through remaining items in batches of 4
    for (var i = startIndex; i < (startIndex + 96); i += 4) {
      // Sum values
      var hourTotal = 0
      for (var n = i; n < (i + 4); n++) {
        hourTotal += rainMeasures.items[n].value
      }
      // Add total for hour
      measuresHours.push(hourTotal)
    }
    measuresHours.reverse() // Reversed for display
    this.graphHours = new Graph(
      'hours',
      new Date(endDateHours),
      measuresHours,
      10,
      50 // Multiples of 10
    )
    //
    // 28 day data
    //
    var endDateDays
    var measuresDays = []
    startIndex = -1
    // Set start index and endDate
    for (startIndex = 0; startIndex < 96; startIndex++) {
      if (moment(rainMeasures.items[startIndex].dateTime).minute() === 45 && moment(rainMeasures.items[startIndex].dateTime).hour() === 23) {
        endDateDays = rainMeasures.items[startIndex].dateTime
        break
      }
    }
    // Iterate through remaining items in batches of 96
    for (i = startIndex; i < (startIndex + 2688); i += 96) {
      // Sum values
      var dayTotal = 0
      for (n = 0; n < 96; n++) {
        dayTotal += rainMeasures.items[i + n].value
      }
      // Add total for hour
      measuresDays.push(dayTotal)
    }
    measuresDays.reverse() // Reversed for display
    this.graphDays = new Graph(
      'days',
      new Date(endDateDays),
      measuresDays,
      50,
      250 // Multiples of 50
    )
  }
}

module.exports = ViewModel
