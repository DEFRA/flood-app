'use strict'
// Chart component
// TODO: this needs heavy refactor
import * as d3 from 'd3'

function LineChart (containerId, data) {
  // Settings
  const windowBreakPoint = 640
  const svgBreakPoint = 576
  const xAxisType = 'daily'

  //
  // Progressive enhancement
  //

  const chart = document.getElementById(containerId)

  // Setup array to combine observed and forecast points
  // and identify startPoint for locator
  let lines = []
  let dataPoint
  let hasObserved = false
  let hasForecast = false
  if (data.observed.length) {
    const errorFilter = l => !l.err
    const errorAndNegativeFilter = l => errorFilter(l) && l._ >= 0
    const filterFunction = data.plotNegativeValues ? errorFilter : errorAndNegativeFilter
    lines = data.observed.filter(filterFunction).map(l => ({ ...l, type: 'observed' })).reverse()
    dataPoint = lines[lines.length - 1] ? JSON.parse(JSON.stringify(lines[lines.length - 1])) : null
    hasObserved = true
  }
  if (data.forecast.length) {
    lines = lines.concat(data.forecast.map(l => ({ ...l, type: 'forecast' })))
    hasForecast = true
  }

  // Set dataPointLatest
  const dataPointLatest = JSON.parse(JSON.stringify(dataPoint))
  let dataPointLocator = dataPointLatest

  // Area generator
  const area = d3.area().curve(d3.curveMonotoneX)
    .x(function (d) { return x(new Date(d.ts)) })
    .y0(function (d) { return height })
    .y1(function (d) { return y(d._) })

  // Line generator
  const line = d3.line().curve(d3.curveMonotoneX)
    .x(function (d) { return x(new Date(d.ts)) })
    .y(function (d) { return y(d._) })

  // Initialize svg
  const svg = d3.select('#' + containerId).append('svg').style('pointer-events', 'none')
  // chartWrapper.on('mouseover', function(d) { d3.select(this).style('cursor', 'pointer') })

  const chartWrapper = svg.append('g').style('pointer-events', 'all')
  chartWrapper.append('g').classed('y grid', true)
  chartWrapper.append('g').classed('x grid', true)
  chartWrapper.append('g').classed('x axis', true)
  chartWrapper.append('g').classed('y axis', true)
  chartWrapper.on('click', function () { showTooltip.call(this, null) })
  chartWrapper.on('mousemove', function () { showTooltip.call(this, null) })
  chartWrapper.on('mouseleave', function () { hideTooltip.call(this, null) })

  // Add observed and forecast elements
  let observedArea, observed, forecastArea, forecast
  if (hasObserved) {
    chartWrapper.append('g').classed('observed observed-focus', true)
    const observedLine = lines.filter(l => l.type === 'observed')
    observedArea = svg.select('.observed').append('path').datum(observedLine).classed('observed-area', true)
    observed = svg.select('.observed').append('path').datum(observedLine).classed('observed-line', true)
  }
  if (hasForecast) {
    chartWrapper.append('g').classed('forecast', true)
    const forecastLine = lines.filter(l => l.type === 'forecast')
    forecastArea = svg.select('.forecast').append('path').datum(forecastLine).classed('forecast-area', true)
    forecast = svg.select('.forecast').append('path').datum(forecastLine).classed('forecast-line', true)
  }

  // Add timeline
  const nowContainer = chartWrapper.append('g').classed('time', true)
  const dateNow = new Date()
  const time = (dateNow.getHours() % 12 || 12) + ':' + (dateNow.getMinutes() < 10 ? '0' : '') + dateNow.getMinutes() + (dateNow.getHours() >= 12 ? 'pm' : 'am')
  nowContainer.append('line').classed('time-line', true)
  nowContainer.append('text').attr('class', 'time-now-text').attr('x', -30).text(time)
  const now = svg.select('.time')

  // Add locator
  const locator = chartWrapper.append('g').classed('locator', true)
  locator.append('line').classed('locator-line', true)
  locator.append('circle').attr('r', 4.5).classed('locator-point', true)

  // Add thresholds group
  const thresholdsContainer = chartWrapper.append('g').classed('thresholds', true)

  // Add tooltip container
  const toolTip = chartWrapper.append('g').attr('class', 'tool-tip')
  toolTip.append('rect').attr('class', 'tool-tip-bg').attr('width', 147)
  toolTip.append('text').attr('class', 'tool-tip-text').attr('x', 12).attr('y', 20)

  // Set level and date formats
  const parseTime = d3.timeFormat('%-I:%M%p')
  // const parseDate = d3.timeFormat('%e %b %Y')
  const parseDateShort = d3.timeFormat('%e %b')

  // Variables defined for subsequent methods
  const margin = {}
  let locatorX, locatorY
  let toolTipX = -1
  let toolTipY = -1
  let timeX
  let width, height
  let xExtent, yExtent
  let x, y, xAxis, yAxis

  // Empty thresholds array
  let thresholds = []

  // Modify axis with thresholds and define scales
  modifyAxis()

  // Render process triggers dimensins to be adjusted
  render()

  // Second render with revised dimentsions draws x axis labels
  render()

  function render () {
    // Update dimensions
    updateDimensions()

    // Update svg elements to new dimensions
    chartWrapper.attr('transform', 'translate(' + (margin.left + margin.right) + ',' + 0 + ')')

    // Update the axis and line
    xAxis.scale(x).ticks(xAxisType === 'daily' ? d3.timeDay : d3.timeMonth, 1)
    yAxis.scale(y)
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.selectAll('.x.axis text').attr('y', 12)
    svg.select('.y.axis').call(yAxis)

    // Update grid lines
    svg.select('.x.grid')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x)
        .ticks(xAxisType === 'daily' ? d3.timeDay : d3.timeMonth, 1)
        .tickSize(-height, 0, 0)
        .tickFormat('')
      )
    svg.select('.y.grid')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width, 0, 0)
        .tickFormat('')
      )

    // Empty thresholds container
    thresholdsContainer.selectAll('*').remove()
    // Add thresholds
    thresholds.forEach(threshold => {
      const thresholdContainer = thresholdsContainer.append('g').attr('class', 'threshold  threshold--' + threshold.id)
      thresholdContainer.classed('threshold--selected', !!threshold.isSelected)
      const bg = thresholdContainer.append('rect').attr('class', 'threshold__bg').attr('x', 0).attr('y', -4).attr('height', 8)
      const line = thresholdContainer.append('line').attr('class', 'threshold__line')
      const label = thresholdContainer.append('g').attr('class', 'threshold-label')
      // const labelBg = label.append('rect').attr('class', 'threshold-label__bg')
      const labelBgPath = label.append('path').attr('class', 'threshold-label__bg')
      const text = label.append('text').attr('class', 'threshold-label__text').text(threshold.name)
      const remove = label.append('g').attr('class', 'threshold__remove')
      remove.append('rect').attr('x', -6).attr('y', -6).attr('width', 20).attr('height', 20)
      remove.append('line').attr('x1', -0.5).attr('y1', -0.5).attr('x2', 7.5).attr('y2', 7.5)
      remove.append('line').attr('x1', 7.5).attr('y1', -0.5).attr('x2', -0.5).attr('y2', 7.5)
      // Set individual elements size and position
      const textWidth = text.node().getBBox().width
      labelBgPath.attr('d', 'm-0.5,-0.5 l' + Math.round(textWidth + 40) + ',0 l0,36 l-' + (Math.round(textWidth + 40) - 50) + ',0 l-7.5,7.5 l-7.5,-7.5 l-35,0 l0,-36 l0,0')
      text.attr('x', 10).attr('y', 22)
      remove.attr('transform', 'translate(' + Math.round(textWidth + 20) + ',' + 14 + ')')
      const labelX = Math.round(x(xExtent[1]) / 8)
      // const labelY = -(labelBg.node().getBBox().height / 2)
      label.attr('transform', 'translate(' + labelX + ',' + -46 + ')')
      thresholdContainer.attr('transform', 'translate(0,' + Math.round(y(threshold.level)) + ')')
      bg.attr('width', x(xExtent[1]))
      line.attr('x2', x(xExtent[1])).attr('y2', 0)
      // Remove button
      remove.on('click', function () {
        d3.event.stopPropagation()
        thresholds = thresholds.filter(function (x) {
          return x.id !== threshold.id
        })
        // Show tooltip
        modifyAxis()
        updateDimensions()
        render()
      })
      // thresholdContainer.append('circle').attr('r', 4.5).attr('class', 'threshold-point')
      thresholdContainer.on('click', function () {
        d3.event.stopPropagation()
        thresholds.forEach(x => { x.isSelected = false })
        threshold.isSelected = true
        // Bring to front
        thresholds = thresholds.filter(function (x) {
          return x.id !== threshold.id
        })
        thresholds.push(threshold)
        // Re render
        render()
      })
      thresholdContainer.on('mousemove', function (d) {
        d3.event.stopPropagation()
      })
      thresholdContainer.on('mouseover', function (d) {
        hideTooltip()
        d3.select(this).classed('threshold--mouseover', true)
      })
      thresholdContainer.on('mouseout', function (d) {
        d3.select(this).classed('threshold--mouseover', false)
      })
    })

    // Update time line
    timeX = Math.floor(x(new Date(data.now)))
    svg.select('.time-line').attr('y1', 0).attr('y2', height)
    now.attr('y1', 0).attr('y2', height).attr('transform', 'translate(' + timeX + ',0)')
    now.select('.time-now-text').attr('y', height + 12).attr('dy', '0.71em')

    // Add height to locator line
    svg.select('.locator-line').attr('y1', 0).attr('y2', height)

    // Draw lines and areas
    if (hasObserved) {
      observed.attr('d', line)
      observedArea.attr('d', area)
    }
    if (hasForecast) {
      forecast.attr('d', line)
      forecastArea.attr('d', area)
    }

    // Update locator position
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')

    // Hide x axis labels that overlap with time now label
    const timeNowX = now.select('.time-now-text').node().getBoundingClientRect().left
    const timeNowWidth = now.select('.time-now-text').node().getBoundingClientRect().width
    d3.selectAll('.x .tick').each(function (d) {
      const tickX = this.getBoundingClientRect().left
      const tickWidth = this.getBoundingClientRect().width
      d3.select(this).classed('tick--hidden', (tickX + tickWidth + 3) > timeNowX && tickX <= (timeNowX + timeNowWidth + 3))
    })
  }

  function modifyAxis () {
    // Note: xExtent uses observed and forecast data rather than lines for the scenario where river levels
    // start or end as -ve since we still need to determine the datetime span of the graph even if the
    // values are excluded from plotting by virtue of being -ve
    xExtent = d3.extent(data.observed.concat(data.forecast), function (d, i) { return new Date(d.ts) })
    yExtent = d3.extent(lines, function (d, i) { return d._ })

    // Increase X range by 5% from now value
    let date = new Date(data.now)
    const percentile = Math.round(Math.abs(xExtent[0] - date) * 0.05)
    date = new Date(Number(data.now) + Number(percentile))
    const xRange = [xExtent[0], xExtent[1]]
    xRange.push(date)
    xExtent[0] = Math.min.apply(Math, xRange)
    xExtent[1] = Math.max.apply(Math, xRange)

    // Initialise Y range to highest and lowest values from the data
    const yRange = [yExtent[0], yExtent[1]]
    yExtent[0] = Math.min.apply(Math, yRange)
    yExtent[1] = Math.max.apply(Math, yRange)

    // Add Y Axis buffers
    yExtent[0] = yExtent[0] >= 0 ? 0 : yExtent[0]
    yExtent[1] = yExtent[1] * 2
    yExtent[1] = yExtent[1] <= 1 ? 1 : yExtent[1]

    // Extend to max threshold
    if (thresholds.length) {
      const maxThreshold = Math.max.apply(Math, thresholds.map(function (x) { return x.level }))
      const maxThresholdBuffered = maxThreshold + (maxThreshold / 100 * 20)
      yExtent[1] = yExtent[1] <= maxThresholdBuffered ? maxThresholdBuffered : yExtent[1]
    }

    // Setup scales
    x = d3.scaleTime().domain(xExtent)
    y = d3.scaleLinear().domain(yExtent)
    y.nice()

    // Initialize axis
    xAxis = d3.axisBottom().tickSizeOuter(0)
    yAxis = d3.axisLeft().ticks(5).tickFormat(function (d) {
      return parseFloat(d).toFixed(2) + 'm'
    }).tickSizeOuter(0)
  }

  function updateDimensions () {
    margin.top = 25
    margin.bottom = 25
    margin.left = 28
    margin.right = 28

    // let xCutOffLeft, xCutOffRight

    // Get dimensions based on parent size
    const parentWidth = Math.floor(d3.select('#' + containerId).node().getBoundingClientRect().width)
    const parentHeight = Math.floor(d3.select('#' + containerId).node().getBoundingClientRect().height)

    // Number of days in x range
    const daysInRange = Math.round(Math.abs(xExtent[1] - xExtent[0]) / 1000 / 60 / 60 / 24)

    // X Axis labels
    if (window.innerWidth > windowBreakPoint && parentWidth > svgBreakPoint) {
      // Tablet
      if (daysInRange < 7) {
        // Tablet daily
        xAxis.ticks(d3.timeHour, 12).tickFormat(function (d) {
          const formatter = d3.timeFormat('%a, %e %b')
          return formatter(d)
        })
      } else {
        // Tablet monthly
        xAxis.ticks(d3.timeMonth, 1).tickFormat(function (d) {
          const formatter = d3.timeFormat('%e %b')
          return formatter(d)
        })
      }
      margin.left = 34
      margin.right = 34
    } else {
      // Mobile
      if (daysInRange < 7) {
        // Mobile daily
        xAxis.ticks(d3.timeHour, 12).tickFormat(function (d) {
          const formatter = d3.timeFormat('%-e/%-m')
          return formatter(d)
        })
      } else {
        // Mobile monthly
        xAxis.ticks(d3.timeMonth, 1).tickFormat(function (d) {
          const formatter = d3.timeFormat('%-e/%-m')
          return formatter(d)
        })
      }
    }

    width = parentWidth - margin.left - margin.right
    height = parentHeight - margin.top - margin.bottom

    // Update x and y scales to new dimensions
    x.range([0, width])
    y.range([height, 0])
    y.nice()

    // Update locator position
    if (dataPointLocator) {
      locatorX = Math.floor(x(new Date(dataPointLocator.ts)))
      locatorY = Math.floor(y(dataPointLocator._))
    }
  }

  function updateToolTipBackground () {
    // Set Background size
    const bg = toolTip.select('rect')
    const text = toolTip.select('text')
    // const textWidth = text.node().getBBox().width
    const textHeight = Math.round(text.node().getBBox().height)
    bg.attr('height', textHeight + 23)
    const toolTipWidth = bg.node().getBBox().width
    const toolTipHeight = bg.node().getBBox().height
    // Set background left or right position
    const containerWidth = x(xExtent[1])
    if (toolTipX === -1) {
      // Centered in chart
      toolTipX = containerWidth / 2 - (toolTipWidth / 2)
    } else if (toolTipX >= containerWidth - (toolTipWidth + 10)) {
      // On the left
      toolTipX -= (toolTipWidth + 10)
    } else {
      // On the right
      toolTipX += 10
    }
    // Set background above or below position
    if (toolTipY >= toolTipHeight + 10) {
      toolTipY -= toolTipHeight + 10
    } else {
      toolTipY += 10
    }
    toolTipX = toolTipX.toFixed(0)
    toolTipY = toolTipY.toFixed(0)
  }

  function showTooltip (threshold) {
    // Remove existing content
    toolTip.select('text').selectAll('*').remove()
    if (threshold) {
      // Get X and Y pos from threshold
      toolTipX = -1
      toolTipY = y(threshold.level)
      toolTip.select('text').text(threshold.name)
      dataPointLocator = dataPointLatest
    } else {
      // Get X and Y pos from mouse click
      const x0 = x.invert(d3.mouse(this)[0])
      const bisectDate = d3.bisector(function (d) { return new Date(d.ts) }).left
      const i = bisectDate(lines, x0, 1)
      const d0 = lines[i - 1]
      const d1 = lines[i]
      let d = d0
      if (d1) {
        d = x0 - new Date(d0.ts) > x0 - new Date(d1.ts) ? d1 : d0
      }
      dataPoint.ts = d.ts
      dataPoint._ = d._
      toolTipX = x(new Date(dataPoint.ts))
      toolTipY = (d3.mouse(this)[1])
      toolTip.select('text').append('tspan').attr('class', 'tool-tip-text__strong').attr('dy', '0.5em').text(Number(dataPoint._).toFixed(2) + 'm')
      toolTip.select('text').append('tspan').attr('x', 12).attr('dy', '1.4em').text(parseTime(new Date(dataPoint.ts)).toLowerCase() + ', ' + parseDateShort(new Date(dataPoint.ts)))
      // Set locator position
      dataPointLocator = dataPoint
    }

    // Update locator location
    locatorX = Math.floor(x(new Date(dataPointLocator.ts)))
    locatorY = Math.floor(y(dataPointLocator._))
    const latestX = Math.floor(x(new Date(dataPointLatest.ts)))
    locator.classed('locator--offset', true)
    locator.classed('locator--forecast', locatorX > latestX)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')

    // Update tooltip left/right background
    updateToolTipBackground()

    // Update tooltip location
    toolTip.attr('transform', 'translate(' + toolTipX + ',' + toolTipY + ')')
    toolTip.classed('tool-tip--visible', true)
  }

  function hideTooltip () {
    toolTip.classed('tool-tip--visible', false)
    // Update locator location
    locatorX = Math.floor(x(new Date(dataPointLatest.ts)))
    locatorY = Math.floor(y(dataPointLatest._))
    locator.classed('locator--offset', false)
    locator.classed('locator--forecast', false)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')
    // Reset locator marker to latest
    dataPointLocator = dataPointLatest
  }

  this.removeThreshold = function (id) {
    thresholds = thresholds.filter(function (x) { return x.id !== id })
    svg.select('.threshold--' + id).remove()
    modifyAxis()
    render()
  }

  this.addThreshold = function (threshold) {
    threshold.isSelected = true
    thresholds.forEach(x => { x.isSelected = false })
    const foundThreshold = thresholds.find(function (x) {
      return x.id === threshold.id
    })
    if (foundThreshold) {
      thresholds = thresholds.filter(function (x) {
        return x.id !== threshold.id
      })
    }
    thresholds.push(threshold)
    // Show tooltip
    modifyAxis()
    updateDimensions()
    render()
  }

  // Events
  window.addEventListener('resize', render)

  this.chart = chart
}

window.flood.charts = {
  createLineChart: function (containerId, data) {
    return new LineChart(containerId, data)
  }
}
