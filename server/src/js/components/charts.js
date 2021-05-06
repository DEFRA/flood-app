'use strict'
// Chart component

import { area as d3Area, line as d3Line, curveMonotoneX } from 'd3-shape'

import { axisBottom, axisLeft } from 'd3-axis'

import { scaleLinear, scaleTime } from 'd3-scale'

import { timeFormat } from 'd3-time-format'

import { timeDay } from 'd3-time'

import { select, selectAll, pointer } from 'd3-selection'

import { bisector, extent } from 'd3-array'

function LineChart (containerId, data) {
  // Settings
  const windowBreakPoint = 640
  const svgBreakPoint = 576

  const chart = document.getElementById(containerId)

  // Setup array to combine observed and forecast points and identify startPoint for locator
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
    hasObserved = lines.length > 0
  }
  if (data.forecast.length) {
    lines = lines.concat(data.forecast.map(l => ({ ...l, type: 'forecast' })))
    hasForecast = true
  }

  // Set dataPointLatest
  const dataPointLatest = JSON.parse(JSON.stringify(dataPoint))
  let dataPointLocator = dataPointLatest

  // Area generator
  const area = d3Area().curve(curveMonotoneX)
    .x((d) => { return xScale(new Date(d.ts)) })
    .y0((d) => { return height })
    .y1((d) => { return yScale(d._) })

  // Line generator
  const line = d3Line().curve(curveMonotoneX)
    .x((d) => { return xScale(new Date(d.ts)) })
    .y((d) => { return yScale(d._) })

  // Set level and date formats
  const parseTime = timeFormat('%-I:%M%p')
  const parseDate = timeFormat('%e %b')
  const parseDateShort = timeFormat('%-e/%-m')
  const parseDateLong = timeFormat('%a, %e %b')

  //
  // Private methods
  //

  const renderChart = () => {
    // Set isMobile boolean
    const parentWidth = Math.floor(select('#' + containerId).node().getBoundingClientRect().width)
    const isMobile = window.innerWidth <= windowBreakPoint && parentWidth <= svgBreakPoint

    // Draw axis
    const xAxis = axisBottom().tickSizeOuter(0)
    xAxis.scale(xScale).ticks(timeDay).tickFormat((d) => {
      return isMobile ? parseDateShort(d) : parseDateLong(d)
    })
    yAxis = axisLeft().ticks(5).tickFormat((d) => {
      return parseFloat(d).toFixed(2) + 'm'
    }).tickSizeOuter(0)
    yAxis.scale(yScale)

    // Update svg and clip elements with new dimensions
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').call(yAxis)
    svg.selectAll('.x.axis text').attr('y', 12)
    svgInner.attr('transform', 'translate(' + (margin.left + margin.right) + ',' + 0 + ')')
    clip.attr('width', width).attr('height', height)

    // Update grid lines
    svg.select('.x.grid')
      .attr('transform', 'translate(0,' + height + ')')
      .call(axisBottom(xScale)
        .ticks(timeDay)
        .tickSize(-height, 0, 0)
        .tickFormat('')
      )
    svg.select('.y.grid')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(axisLeft(yScale)
        .ticks(5)
        .tickSize(-width, 0, 0)
        .tickFormat('')
      )

    // Update time line
    const timeX = Math.floor(xScale(new Date(data.now)))
    svg.select('.time-line').attr('y1', 0).attr('y2', height)
    timeLine.attr('y1', 0).attr('y2', height).attr('transform', 'translate(' + timeX + ',0)')
    timeLabel.attr('y', height + 12).attr('transform', 'translate(' + timeX + ',0)').attr('dy', '0.71em')

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
    const timeNowX = timeLabel.node().getBoundingClientRect().left
    const timeNowWidth = timeLabel.node().getBoundingClientRect().width
    const ticks = selectAll('.x .tick')
    ticks.each((d, i, n) => {
      const tick = n[i]
      const tickX = tick.getBoundingClientRect().left
      const tickWidth = tick.getBoundingClientRect().width
      const isOverlap = (tickX + tickWidth + 5) > timeNowX && tickX <= (timeNowX + timeNowWidth + 5)
      select(tick).classed('tick--hidden', isOverlap)
    })
  }

  const renderThresholds = () => {
    // Empty thresholds container
    thresholdsContainer.selectAll('*').remove()
    // Add thresholds
    thresholds.forEach(threshold => {
      const thresholdContainer = thresholdsContainer.append('g').attr('class', 'threshold  threshold--' + threshold.id)
      thresholdContainer.attr('data-id', threshold.id)
      thresholdContainer.classed('threshold--selected', !!threshold.isSelected)
      const bg = thresholdContainer.append('rect').attr('class', 'threshold__bg').attr('x', 0).attr('y', -4).attr('height', 8)
      const line = thresholdContainer.append('line').attr('class', 'threshold__line')
      const label = thresholdContainer.append('g').attr('class', 'threshold-label')
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
      const labelX = Math.round(width / 8)
      label.attr('transform', 'translate(' + labelX + ',' + -46 + ')')
      thresholdContainer.attr('transform', 'translate(0,' + Math.round(yScale(threshold.level)) + ')')
      bg.attr('width', xScale(xExtent[1]))
      line.attr('x2', xScale(xExtent[1])).attr('y2', 0)
    })
  }

  const updateToolTipBackground = () => {
    // Set Background size
    const bg = toolTip.select('rect')
    const text = toolTip.select('text')
    // const textWidth = text.node().getBBox().width
    const textHeight = Math.round(text.node().getBBox().height)
    bg.attr('height', textHeight + 23)
    const toolTipWidth = bg.node().getBBox().width
    const toolTipHeight = bg.node().getBBox().height
    // Set background left or right position
    const containerWidth = xScale(xExtent[1])
    if (toolTipX >= containerWidth - (toolTipWidth + 10)) {
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

  const updateLocator = () => {
    dataPointLocator = dataPoint // Set locator position
    locatorX = Math.floor(xScale(new Date(dataPointLocator.ts)))
    locatorY = Math.floor(yScale(dataPointLocator._))
    const latestX = Math.floor(xScale(new Date(dataPointLatest.ts)))
    locator.classed('locator--offset', true)
    locator.classed('locator--forecast', locatorX > latestX)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')
  }

  const showTooltip = (e) => {
    // Remove existing content
    toolTip.select('text').selectAll('*').remove()
    const mouseDate = xScale.invert(pointer(e)[0])
    const bisectDate = bisector((d) => { return new Date(d.ts) }).left
    const i = bisectDate(lines, mouseDate, 1) // returns the index to the current data item
    const d0 = lines[i - 1]
    const d1 = lines[i] || lines[i - 1]
    // Determine which date value is closest to the mouse
    const d = mouseDate - new Date(d0.ts) > new Date(d1.ts) - mouseDate ? d1 : d0
    dataPoint.ts = d.ts
    dataPoint._ = d._
    toolTipX = xScale(new Date(dataPoint.ts))
    toolTipY = pointer(e)[1]
    toolTip.select('text').append('tspan').attr('class', 'tool-tip-text__strong').attr('dy', '0.5em').text(Number(dataPoint._).toFixed(2) + 'm')
    toolTip.select('text').append('tspan').attr('x', 12).attr('dy', '1.4em').text(parseTime(new Date(dataPoint.ts)).toLowerCase() + ', ' + parseDate(new Date(dataPoint.ts)))
    // Update tooltip left/right background
    updateToolTipBackground()
    // Update tooltip location
    toolTip.attr('transform', 'translate(' + toolTipX + ',' + toolTipY + ')')
    toolTip.classed('tool-tip--visible', true)
  }

  const hideTooltip = () => {
    toolTip.classed('tool-tip--visible', false)
  }

  const resetLocator = () => {
    // Update locator location
    locatorX = Math.floor(xScale(new Date(dataPointLatest.ts)))
    locatorY = Math.floor(yScale(dataPointLatest._))
    locator.classed('locator--offset', false)
    locator.classed('locator--forecast', false)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')
    // Reset locator marker to latest
    dataPointLocator = dataPointLatest
  }

  const updateAxisY = () => {
    // Extend or reduce y extent
    const maxThreshold = Math.max.apply(Math, thresholds.map((x) => { return x.level }))
    const minThreshold = Math.min.apply(Math, thresholds.map((x) => { return x.level }))
    const maxData = Math.max(maxThreshold, yExtentDataMax)
    const minData = Math.min(minThreshold, yExtentDataMin)
    let range = maxData - minData
    range = range < 1 ? 1 : range
    // Add 1/3rd or range above and below, capped at zero for non-negative ranges
    const yRangeUpperBuffered = (maxData + (range / 3)).toFixed(2)
    const yRangeLowerBuffered = (minData - (range / 3)).toFixed(2)
    yExtent[1] = yExtentDataMax <= yRangeUpperBuffered ? yRangeUpperBuffered : yExtentDataMax
    yExtent[0] = window.flood.model.station.isRiver ? (yRangeLowerBuffered < 0 ? 0 : yRangeLowerBuffered) : yRangeLowerBuffered
    // Update y scale
    yScale = scaleLinear().domain(yExtent).nice()
    yScale.range([height, 0])
    // Update y axis
    yAxis = axisLeft()
    yAxis.ticks(5).tickFormat((d) => { return parseFloat(d).toFixed(2) + 'm' }).tickSizeOuter(0)
    yAxis.scale(yScale)
  }

  const addThreshold = (threshold) => {
    // Update thresholds array
    thresholds = thresholds.filter((x) => { return x.id !== threshold.id })
    thresholds.forEach(x => { x.isSelected = false })
    threshold.isSelected = true
    thresholds.push(threshold)
    updateAxisY()
    // Re-render
    resetLocator()
    renderChart()
    renderThresholds()
  }

  const removeThreshold = (id) => {
    // Update thresholds array
    thresholds = thresholds.filter((x) => { return x.id !== id })
    updateAxisY()
    // Re-render
    updateLocator()
    renderChart()
    renderThresholds()
  }

  //
  // Setup
  //

  const svg = select('#' + containerId).append('svg').style('pointer-events', 'none')
  const svgInner = svg.append('g').style('pointer-events', 'all')
  svgInner.append('g').classed('y grid', true)
  svgInner.append('g').classed('x grid', true)
  svgInner.append('g').classed('x axis', true)
  svgInner.append('g').classed('y axis', true)
  const clip = svgInner.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('x', 0).attr('y', 0)
  const clipInner = svgInner.append('g').attr('clip-path', 'url(#clip)')

  // Add observed and forecast elements
  let observedArea, observed, forecastArea, forecast
  if (hasObserved) {
    clipInner.append('g').classed('observed observed-focus', true)
    const observedLine = lines.filter(l => l.type === 'observed')
    observedArea = svg.select('.observed').append('path').datum(observedLine).classed('observed-area', true)
    observed = svg.select('.observed').append('path').datum(observedLine).classed('observed-line', true)
  }
  if (hasForecast) {
    clipInner.append('g').classed('forecast', true)
    const forecastLine = lines.filter(l => l.type === 'forecast')
    forecastArea = svg.select('.forecast').append('path').datum(forecastLine).classed('forecast-area', true)
    forecast = svg.select('.forecast').append('path').datum(forecastLine).classed('forecast-line', true)
  }

  // Add timeline
  const timeLine = clipInner.append('line').classed('time-line', true)
  const dateNow = new Date()
  const time = (dateNow.getHours() % 12 || 12) + ':' + (dateNow.getMinutes() < 10 ? '0' : '') + dateNow.getMinutes() + (dateNow.getHours() >= 12 ? 'pm' : 'am')
  const timeLabel = svgInner.append('text').attr('class', 'time-now-text').attr('x', -26).text(time)

  // Add locator
  const locator = clipInner.append('g').classed('locator', true)
  locator.append('line').classed('locator-line', true)
  locator.append('circle').attr('r', 4.5).classed('locator-point', true)

  // Add thresholds group
  const thresholdsContainer = clipInner.append('g').classed('thresholds', true)

  // Add tooltip container
  const toolTip = clipInner.append('g').attr('class', 'tool-tip')
  toolTip.append('rect').attr('class', 'tool-tip-bg').attr('width', 147)
  toolTip.append('text').attr('class', 'tool-tip-text').attr('x', 12).attr('y', 20)

  // Get width and height
  const margin = { top: 25, bottom: 25, left: 28, right: 28 }
  const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
  let width = Math.floor(containerBoundingRect.width) - margin.left - margin.right
  let height = Math.floor(containerBoundingRect.height) - margin.top - margin.bottom

  // Note: xExtent uses observed and forecast data rather than lines for the scenario where river levels
  // start or end as -ve since we still need to determine the datetime span of the graph even if the
  // values are excluded from plotting by virtue of being -ve

  // Set x scale extent
  const xExtent = extent(data.observed.concat(data.forecast), (d, i) => { return new Date(d.ts) })
  // Increase x extent by 5% from now value
  let date = new Date(data.now)
  const percentile = Math.round(Math.abs(xExtent[0] - date) * 0.05)
  date = new Date(Number(data.now) + Number(percentile))
  const xRange = [xExtent[0], xExtent[1]]
  xRange.push(date)
  xExtent[0] = Math.min.apply(Math, xRange)
  xExtent[1] = Math.max.apply(Math, xRange)
  // Set x input domain
  const xScaleInitial = scaleTime().domain(xExtent)
  const xScale = scaleTime().domain(xExtent)
  // Set x output range
  xScaleInitial.range([0, width])
  xScale.range([0, width])

  // Set y scale extent
  const yExtent = extent(lines, (d, i) => { return d._ })
  // Adjust y extent to highest and lowest values from the data
  yExtent[0] = Math.min.apply(Math, yExtent)
  yExtent[1] = Math.max.apply(Math, yExtent)
  // Reference to intial y extent min and max used when removing thresholds
  const yExtentDataMin = yExtent[0]
  const yExtentDataMax = yExtent[1]
  // Add 1/3rd or range above and below, capped at zero for non-negative ranges
  let yRange = yExtent[1] - yExtent[0]
  yRange = yRange < 1 ? 1 : yRange // make range minimum 1m to stop zigzag
  const yRangeUpperBuffer = (yExtent[1] + (yRange / 3)).toFixed(2)
  const yRangeLowerBuffer = (yExtent[0] - (yRange / 3)).toFixed(2)

  yExtent[0] = window.flood.model.station.isRiver ? (yRangeLowerBuffer < 0 ? 0 : yRangeLowerBuffer) : yRangeLowerBuffer

  yExtent[1] = yRangeUpperBuffer
  // Set y input domain
  let yScale = scaleLinear().domain(yExtent).nice()
  // Set y output range
  yScale.range([height, 0])

  // State properties
  let locatorX = -1
  let locatorY = -1
  let toolTipX, toolTipY, yAxis
  let thresholds = []

  if (hasObserved || hasForecast) {
    renderChart()
    //
    // Public methods
    //

    this.removeThreshold = (id) => {
      removeThreshold(id)
    }

    this.addThreshold = (threshold) => {
      addThreshold(threshold)
    }

    this.chart = chart

    //
    // Events
    //

    window.addEventListener('resize', () => {
      const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
      width = Math.floor(containerBoundingRect.width) - margin.left - margin.right
      height = Math.floor(containerBoundingRect.height) - margin.top - margin.bottom
      xScale.range([0, width])
      yScale.range([height, 0])
      hideTooltip()
      updateLocator()
      renderChart()
      renderThresholds()
    })

    svgInner.on('click', (e) => {
      if (e.target.closest('.threshold')) return
      updateLocator()
      showTooltip(e)
    })

    svgInner.on('mousemove', (e) => {
      if (e.target.closest('.threshold')) return
      updateLocator()
      showTooltip(e)
    })

    svgInner.on('mouseleave', (e) => {
      hideTooltip()
      resetLocator()
    })

    thresholdsContainer.on('click', (e) => {
      e.stopPropagation()
      const thresholdContainer = e.target.closest('.threshold')
      if (e.target.closest('.threshold__remove')) {
        removeThreshold(thresholdContainer.getAttribute('data-id'))
      } else if (thresholdContainer) {
        const threshold = thresholds.find((x) => { return x.id === thresholdContainer.getAttribute('data-id') })
        addThreshold(threshold)
      }
    })

    thresholdsContainer.on('mouseover', (e) => {
      if (e.target.closest('.threshold')) hideTooltip()
    })
  } else {
    // no Values so hide chart div
    document.getElementsByClassName('defra-line-chart')[0].style.display = 'none'
  }
}

window.flood.charts = {
  createLineChart: (containerId, data) => {
    return new LineChart(containerId, data)
  }
}
