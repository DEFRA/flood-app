(function (window, flood) {
  var google = window.google

  google.charts.setOnLoadCallback(function () {
    var model = flood.model
    var view, chart
    var values = []
    var $marker = document.getElementById('marker')

    // Stop highest line aligning with top of chart
    var maxLine = Math.max(model.station.porMaxValue, model.forecast.alertThreshold || model.station.percentile5, model.forecast.warningThreshold)

    var highestLabel
    if (model.station.isCoastal) {
      highestLabel = 'Highest astronomical tide prediction ' + model.station.porMaxValue + 'm'
    } else if (model.station.isGroundwater) {
      highestLabel = 'Highest recorded groundwater level ' + model.station.porMaxValue + 'm'
    } else {
      highestLabel = 'Highest recorded level ' + model.station.porMaxValue + 'm on ' + model.station.formattedPorMaxDate
    }

    values.push([
      { id: 'ts', label: 'Timestamp', type: 'datetime' },
      { type: 'string', role: 'annotation' },
      { type: 'string', role: 'annotationText' },
      { id: 'val', label: 'Measured level', type: 'number' },
      { id: 'forecast', label: 'Forecast level', type: 'number' },
      { id: 'RESFAL', label: 'RES FAL', type: 'number' },
      { id: 'RESFW', label: 'RES FW', type: 'number' },
      { id: 'porMaxValue', label: highestLabel, type: 'number' }
    ])

    function forEach (items, callback) {
      for (var i = 0; i < items.length; i++) {
        callback.call(items, items[i], i)
      }
    }

    // Read observed data
    forEach(document.querySelectorAll('table#telemetry tbody tr'), function (item) {
      var arr = []
      var $time = item.querySelector('td[scope="row"]')
      var $reading = item.querySelector('td[class="numeric"]')
      var value = parseFloat($reading.textContent)
      var date = new Date($time.querySelector('time').getAttribute('datetime'))

      arr.push(date)
      arr.push(null)
      arr.push(null)
      arr.push(value)
      arr.push(null)
      arr.push(model.forecast.alertThreshold || model.station.percentile5)
      arr.push(model.forecast.warningThreshold)
      arr.push(model.station.porMaxValue)

      values.push(arr)
    })

    // Read forecast data
    forEach(document.querySelectorAll('table#forecast tbody tr'), function (item) {
      var arr = []
      var $time = item.querySelector('td[scope=row]')
      var $reading = item.querySelector('td[class=numeric]')
      var value = parseFloat($reading.textContent)
      var date = new Date($time.querySelector('time').getAttribute('datetime'))

      arr.push(date)
      arr.push(null)
      arr.push(null)
      arr.push(null)
      arr.push(value)
      arr.push(model.forecast.alertThreshold || model.station.percentile5)
      arr.push(model.forecast.warningThreshold)
      arr.push(model.station.porMaxValue)

      values.push(arr)
    })

    var now = new Date()

    var nowArray = [
      now,
      '',
      '',
      null,
      null,
      model.forecast.alertThreshold || model.station.percentile5,
      model.forecast.warningThreshold,
      model.station.porMaxValue
    ]
    values.push(nowArray)

    var tomorrow = new Date()
    tomorrow.setDate(now.getDate() + 1)
    tomorrow.setHours(0)
    tomorrow.setMinutes(0)
    tomorrow.setSeconds(0, 0)

    // Manufacture gap post now line to emphasize
    var thenArray = [
      tomorrow,
      null,
      null,
      null,
      null,
      model.forecast.alertThreshold || model.station.percentile5,
      model.forecast.warningThreshold,
      model.station.porMaxValue
    ]
    values.push(thenArray)

    var data = google.visualization.arrayToDataTable(values)

    var dateFormatter = new google.visualization.DateFormat({
      pattern: 'h:mmaa, d MMM'
    })

    var numberFormatter = new google.visualization.NumberFormat({
      pattern: '0.00m'
    })

    dateFormatter.format(data, 0)
    numberFormatter.format(data, 3)
    numberFormatter.format(data, 4)

    var chartOptions = {
      height: 400,
      fontName: 'nta',
      annotations: {
        textStyle: {
          color: '#000000',
          fontSize: 13
        },
        alwaysOutside: true,
        stem: {
          color: '#000000',
          width: 6
        },
        style: 'line'
      },
      chartArea: {
        top: 10,
        right: 0,
        bottom: 50,
        left: 50,
        backgroundColor: {
          stroke: '#ccc',
          strokeWidth: 1
        }
      },
      hAxis: {
        gridlines: {
          count: -1,
          units: {
            days: { format: ['E, d MMM', 'd MMM'] },
            hours: { format: ['d MMM, haa'] }
          }
        },
        viewWindowMode: 'maximized',
        textStyle: {
          bold: false
        }
      },
      vAxis: {
        baseline: model.station.isCoastal ? Math.floor(data.getColumnRange(1).min) : 'automatic',
        gridlines: {
          count: model.station.isCoastal ? -1 : 5
        },
        format: '0.00m',
        textStyle: {
          bold: false
        },
        titleTextStyle: {
          italic: false,
          bold: false
        },
        maxValue: maxLine * 1.05
      },
      series: {
        0: {
          type: 'line',
          color: '#005ea5',
          visibleInLegend: false
        },
        1: {
          type: 'line',
          color: '#52585a',
          lineDashStyle: [2, 2],
          lineWidth: 3,
          curveType: 'function',
          visibleInLegend: false
        },
        2: {
          type: 'line',
          enableInteractivity: false,
          color: '#F47738',
          lineWidth: 2,
          tooltip: false
        },
        3: {
          type: 'line',
          enableInteractivity: false,
          color: '#B10E1E',
          lineWidth: 2,
          tooltip: false
        },
        4: {
          type: 'line',
          enableInteractivity: false,
          color: '#000000',
          lineWidth: 2,
          tooltip: false
        }
      }
    }

    view = new google.visualization.DataView(data)

    chart = new google.visualization.ChartWrapper({
      chartType: 'ComboChart',
      containerId: 'station-chart',
      dataTable: view,
      options: chartOptions
    })

    chart.draw()

    // Toggle Highest level line
    var $highestLevelShow = document.querySelector('.max.max-off')
    var $highestLevelHide = document.querySelector('.max:not(.max-off)')

    function hideMaxLevel () {
      if ($highestLevelHide) $highestLevelHide.style.display = 'none'
      if ($highestLevelShow) $highestLevelShow.style.display = ''
      view.hideColumns([7])
      chart.draw()
    }

    function showMaxLevel () {
      if ($highestLevelShow) $highestLevelShow.style.display = 'none'
      if ($highestLevelHide) $highestLevelHide.style.display = ''
      view.setColumns([0, 1, 2, 3, 4, 5, 6, 7])
      chart.draw()
    }

    if ($highestLevelHide) {
      $highestLevelHide.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          e.preventDefault()
          hideMaxLevel()
        }
      })
    }

    if ($highestLevelShow) {
      $highestLevelShow.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          e.preventDefault()
          showMaxLevel()
        }
      })
    }

    if (model.station.floodingIsPossible || model.station.isCoastal) {
      showMaxLevel()
    } else {
      hideMaxLevel()
    }

    function positionMarker () {
      var cli = chart.getChart().getChartLayoutInterface()
      var left = Math.round(cli.getXLocation(now))
      var width = Math.ceil($marker.offsetWidth)
      $marker.style.visibility = 'visible'
      $marker.style.left = Math.round(left - (width / 2)) + 'px'
    }

    // Make the font of today's date on the x-axis bold
    google.visualization.events.addListener(chart, 'ready', function () {
      // set today's date's style
      var now = new Date().setHours(0, 0, 0, 0)
      // this css selector may be flakey
      // beware adding animation to the chart breaks this
      var labels = document.querySelectorAll('#station-chart > div > div:nth-child(1) > div > svg > g:nth-child(3) > g:nth-child(4) g')

      forEach(labels, function (item) {
        var date = new Date(item.textContent + ' ' + new Date(now).getFullYear()).setHours(0, 0, 0, 0)
        if (date === now) {
          item.style.fontWeight = 'bold'
        }
      })

      positionMarker()
    })

    // Add `ready` listener to adjust the width of the
    // svg element to accomodate any overflowing xAxis labels
    google.visualization.events.addListener(chart, 'ready', function () {
      var svg = chart.getContainer().querySelector('svg')
      var width = +svg.getAttribute('width')
      svg.setAttribute('width', width + 20)
    })

    // Wait for the ready event in order to request the chart
    google.visualization.events.addOneTimeListener(chart, 'ready', function () {
      // Select the latest measured value to initially show the tooltip
      chart.getChart().setSelection([{ row: 0, column: 3 }])
    })

    window.onresize = function () {
      if (typeof chart !== 'undefined') {
        chart.draw()
      }
    }
  })
})(window, window.Flood)
