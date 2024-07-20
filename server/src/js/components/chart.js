'use strict'
// Chart component

import '../utils'
import { axisBottom, axisLeft } from 'd3-axis'
import { scaleLinear, scaleBand, scaleTime } from 'd3-scale'
import { timeFormat } from 'd3-time-format'
import { select, selectAll, pointer } from 'd3-selection'
import { max, bisector, extent } from 'd3-array'
import { timeHour, timeMinute } from 'd3-time'
import { area as d3Area, line as d3Line, curveMonotoneX } from 'd3-shape'

const { forEach, simplify } = window.flood.utils

export function createPaginationControls () {
  const pagination = document.createElement('div')
  pagination.classList.add('defra-chart-controls__group', 'defra-chart-controls__group--pagination')
  pagination.style.display = 'none'

  const pageBack = document.createElement('button')
  pageBack.className = 'defra-chart-controls__button'
  pageBack.setAttribute('data-direction', 'back')
  pageBack.setAttribute('aria-controls', 'bar-chart')
  pageBack.setAttribute('aria-describedby', 'page-back-description')

  const pageBackText = document.createElement('span')
  pageBackText.className = 'defra-chart-controls__button-text'

  const pageBackDescription = document.createElement('span')
  pageBackDescription.id = 'page-back-description'
  pageBackDescription.className = 'govuk-visually-hidden'
  pageBackDescription.setAttribute('aria-live', 'polite')

  pageBack.appendChild(pageBackText)
  pageBack.appendChild(pageBackDescription)

  const pageForward = document.createElement('button')
  pageForward.className = 'defra-chart-controls__button'
  pageForward.setAttribute('data-direction', 'forward')
  pageForward.setAttribute('aria-controls', 'bar-chart')
  pageForward.setAttribute('aria-describedby', 'page-forward-description')

  const pageForwardText = document.createElement('span')
  pageForwardText.className = 'defra-chart-controls__text'

  const pageForwardDescription = document.createElement('span')
  pageForwardDescription.id = 'page-forward-description'
  pageForwardDescription.className = 'govuk-visually-hidden'
  pageForwardDescription.setAttribute('aria-live', 'polite')

  pageForward.appendChild(pageForwardText)
  pageForward.appendChild(pageForwardDescription)

  pagination.appendChild(pageBack)
  pagination.appendChild(pageForward)

  return {
    pagination,
    pageForward,
    pageForwardText,
    pageForwardDescription,
    pageBack,
    pageBackText,
    pageBackDescription
  }
}

export function updatePagination ({
  start, end, duration, dataStart, paginationControlGroup,
  pageForward, pageForwardText, pageForwardDescription,
  pageBack, pageBackText, pageBackDescription
}) {
  // Set paging values and ensure they are within data range
  const now = new Date()
  let nextStart = new Date(start.getTime() + duration)
  let nextEnd = new Date(end.getTime() + duration)
  let previousStart = new Date(start.getTime() - duration)
  let previousEnd = new Date(end.getTime() - duration)
  nextEnd = nextEnd.getTime() <= now.getTime() ? nextEnd.toISOString().replace(/.\d+Z$/g, 'Z') : null
  nextStart = nextEnd ? nextStart.toISOString().replace(/.\d+Z$/g, 'Z') : null
  previousStart = previousStart.getTime() >= dataStart.getTime() ? previousStart.toISOString().replace(/.\d+Z$/g, 'Z') : null
  previousEnd = previousStart ? previousEnd.toISOString().replace(/.\d+Z$/g, 'Z') : null
  // Set properties
  paginationControlGroup.style.display = (nextStart || previousEnd) ? 'inline-block' : 'none'
  pageForward.setAttribute('data-start', nextStart)
  pageForward.setAttribute('data-end', nextEnd)
  pageBack.setAttribute('data-start', previousStart)
  pageBack.setAttribute('data-end', previousEnd)
  pageForward.setAttribute('aria-disabled', !(nextStart && nextEnd))
  pageBack.setAttribute('data-journey-click', 'Rainfall:Chart Interaction:Rainfall - Previous 24hrs')
  pageForward.setAttribute('data-journey-click', 'Rainfall:Chart Interaction:Rainfall - Next 24hrs')
  pageBack.setAttribute('aria-disabled', !(previousStart && previousEnd))
  pageForwardText.innerText = 'Forward'
  pageBackText.innerText = 'Back'
  pageForwardDescription.innerText = ''
  pageBackDescription.innerText = ''
}

export function createResolutionControls ({ bands }) {
  const resolutionControlGroup = document.createElement('div')
  resolutionControlGroup.classList.add('defra-chart-controls__group', 'defra-chart-controls__group--resolution')
  for (let i = bands.length - 1; i >= 0; i--) {
    const band = bands[i]
    const control = document.createElement('button')

    const start = new Date()
    const end = new Date()
    start.setHours(start.getHours() - (bands.find(({ period }) => period === band.period).days * 24))

    control.className = 'defra-chart-controls__button'
    control.style.display = 'none'
    control.setAttribute('data-period', band.period)
    control.setAttribute('data-start', start.toISOString().replace(/.\d+Z$/g, 'Z'))
    control.setAttribute('data-end', end.toISOString().replace(/.\d+Z$/g, 'Z'))
    control.setAttribute('aria-controls', 'bar-chart')

    const text = document.createElement('span')
    text.className = 'defra-chart-controls__text'
    text.innerText = band.label

    control.appendChild(text)
    resolutionControlGroup.appendChild(control)
  }
  return resolutionControlGroup
}

export function updateResolutionControls ({ bands, dataCache, dataStart, period, resolutionControlGroup }) {
  const now = new Date()
  const dataDurationDays = (new Date(now.getTime() - dataStart.getTime())) / (1000 * 60 * 60 * 24)
  // Check there are at least 2 telemetry arrays
  let numBands = 0
  for (let i = 0; i < bands.length; i++) {
    numBands += Object.getOwnPropertyDescriptor(dataCache, bands[i].period) ? 1 : 0
  }
  // Determine which controls to display
  forEach(resolutionControlGroup.querySelectorAll('.defra-chart-controls__button'), button => {
    const isBand = period === button.getAttribute('data-period')
    const band = bands.find(x => x.period === button.getAttribute('data-period'))
    button.checked = isBand
    button.style.display = (band.days <= dataDurationDays) && numBands > 1 ? 'inline-block' : 'none'
    button.classList.toggle('defra-chart-controls__button--selected', isBand)
  })
}

function BarChart (containerId, stationId, data) {
  const renderChart = () => {
    // Setup scales with domains
    xScale = setScaleX()
    yScale = setScaleY(period === 'minutes' ? 1 : 4)

    // Set right margin depending on length of labels
    const numChars = yScale.domain()[1].toString().length
    const margin = { top: 5, bottom: 45, left: 0, right: 8 + (numChars * 9) }

    // Define width and height
    const containerBoundingRect = container.getBoundingClientRect()
    const controlsBoundingRect = controls.getBoundingClientRect()
    const paginationBoundingRect = pagination.getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
    height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top
    height -= (Math.floor(controlsBoundingRect.height) + Math.floor(paginationBoundingRect.height))

    // Calculate new xScale from range
    xScale = xScale.range([0, width]).padding(0.4)
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = timeFormat('%H:%M')(new Date(d))
      const labelsHours = ['00:00']
      const labelsMinutes = ['00:00', '06:00', '12:00', '18:00']
      const labels = period === 'hours' ? labelsHours : labelsMinutes
      return labels.includes(hourMinute) && i >= 2 // Don't show lable if before 3rd tick
    }))
    xAxis.tickFormat((d) => { return '' })

    // Calculate new yScale from range
    yScale = yScale.range([height, 0])
    const yAxis = axisLeft(yScale).tickSizeOuter(0).ticks(5)

    // Position axis bottom and right
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').attr('transform', 'translate(' + width + ', 0)').call(yAxis)

    // Format X Axis ticks
    svg.select('.x.axis').selectAll('text').each(formatLabelsX)

    // Position y ticks
    svg.select('.y.axis').style('text-anchor', 'start')
    svg.selectAll('.y.axis .tick line').attr('x2', 6)
    svg.selectAll('.y.axis .tick text').attr('x', 9)

    // Position y grid
    svg.select('.y.grid')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(axisLeft(yScale).tickSizeOuter(0).ticks(5).tickSize(-width, 0, 0).tickFormat(''))

    // Update grid container and text clip
    grid.attr('width', width).attr('height', height)
    clipText.attr('width', width).attr('height', height)

    // Add bars
    gridRow.selectAll('.bar').remove()
    const bars = gridRow.selectAll('.bar').data(dataPage.slice().reverse()).enter()
      .append('g')
      .attr('role', 'cell')
      .attr('tabindex', (d) => { return d === dataItem ? 0 : -1 })
      // .attr('focusable', (d) => { return d === dataItem })
      .attr('data-index', (d, i) => { return i })
      .attr('data-datetime', (d) => { return d.dateTime })
      .attr('class', 'bar')
      .attr('aria-hidden', (d) => { return !(d.value > 0 || d.isLatest) })
      .classed('bar--incomplete', (d) => { return d.isInComplete })
      .classed('bar--latest', (d) => { return d.isLatest })
    bars.filter((d) => { return d.isLatest }).append('line').attr('aria-hidden', true).attr('class', 'latest-line')
    bars.append('rect').attr('class', 'bar__fill')
    bars.append('text').text((d) => {
      const text = getItemText(d)
      return `${text.value}, ${text.period}, ${text.monthLong} `
    })

    // Position bars
    svg.selectAll('.bar')
      .attr('transform', (d) => { return 'translate(' + xScale(d.dateTime) + ', 0)' })
    svg.selectAll('.bar__fill')
      .attr('x', 0)
      .attr('y', (d) => { return yScale(d.value) })
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => {
        return height - yScale(d.value)
      })

    // Draw latest reading line
    const xLatest = Math.round(xScale.bandwidth() / 2)
    svg.select('.latest-line').attr('transform', 'translate(' + xLatest + ', 0)').attr('y1', 0).attr('y2', height)
  }

  const setScaleX = () => {
    return scaleBand().domain(dataPage.map((d) => { return d.dateTime }).reverse())
  }

  const setScaleY = (minimum) => {
    // Get max from data or minimum
    let maxData = Math.max(max(dataPage, (d) => { return d.value }), minimum)
    // Buffer 25% and round to nearest integer
    maxData = Math.ceil((maxData * 1.25) * 10 / 10)
    // Ensure y scale always divides by 5
    maxData = Math.ceil(maxData / 5) * 5
    // return scaleLinear().domain([0, maxData])
    return scaleLinear().domain([0, maxData])
  }

  const setTooltipPosition = (x, y) => {
    // Set Background size
    const text = tooltip.select('text')
    const txtHeight = Math.round(text.node().getBBox().height) + 23
    const pathLength = period === 'minutes' ? 182 : 142
    const pathLeft = `M${pathLength},${(txtHeight / 2) - 8}l-0,-${(txtHeight / 2) - 8}l-${pathLength},0l0,${txtHeight}l${pathLength},0l0,-${(txtHeight / 2) - 8}l8,-8l-8,-8Z`
    const pathRight = `M8,${(txtHeight / 2) - 8}l0,-${(txtHeight / 2) - 8}l${pathLength},0l-0,${txtHeight}l-${pathLength},0l-0,-${(txtHeight / 2) - 8}l-8,-8l8,-8Z`
    const pathCentre = `M${pathLength},${txtHeight}l0,-${txtHeight}l-${pathLength},0l0,${txtHeight}l${pathLength},0Z`
    const pathWidth = pathLength + 8
    // Set tooltip layout
    tooltipText.attr('x', 0).attr('y', 20)
    if (x >= width - (pathWidth + 10)) {
      // tooltip on the left
      x -= (pathWidth + 3)
      tooltipPath.attr('d', pathLeft)
      tooltipValue.attr('x', 12)
      tooltipDescription.attr('x', 12)
    } else {
      // tooltip on the right
      x += 3
      tooltipPath.attr('d', pathRight)
      tooltipValue.attr('x', 20)
      tooltipDescription.attr('x', 20)
    }
    // tooltip centred
    if (x <= 0) {
      x = 0
      tooltipPath.attr('d', pathCentre)
    }
    // Set background above or below position
    const tooltipHeight = tooltipPath.node().getBBox().height
    const tooltipMarginTop = 10
    const tooltipMarginBottom = height - (tooltipHeight + 10)
    y -= tooltipHeight / 2
    y = y < tooltipMarginTop ? tooltipMarginTop : y > tooltipMarginBottom ? tooltipMarginBottom : y
    tooltip.attr('transform', 'translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ')')
    tooltip.classed('tooltip--visible', true)
    locatorLine.classed('locator__line--visible', !dataItem.isLatest)
  }

  const showTooltip = (tooltipY = 10) => {
    // Choose which value to show
    if (!dataItem) return
    // Get tooltip position and content
    const text = getItemText(dataItem)
    tooltipValue.attr('dy', '0.5em').text(text.value)
    tooltipDescription.attr('dy', '1.4em').text(`${text.period}, ${text.monthShort}`)
    // Update locator
    locator.attr('transform', 'translate(' + Math.round(xScale(dataItem.dateTime)) + ', 0)')
    locatorBackground
      .attr('x', 0).attr('y', 0).attr('width', xScale.bandwidth()).attr('height', height)
      .classed('locator__background--visible', (interfaceType === 'keyboard' && document.activeElement.tagName.toLocaleLowerCase() === 'g'))
    locatorLine.attr('transform', 'translate(' + Math.round(xScale.bandwidth() / 2) + ', 0)').attr('y1', 0).attr('y2', height)
    // Update bar selected state
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    svg.select('[data-datetime="' + dataItem.dateTime + '"]').classed('bar--selected', true)
    // Update tooltip location
    const tooltipX = Math.round(xScale(dataItem.dateTime)) + (xScale.bandwidth() / 2)
    setTooltipPosition(tooltipX, tooltipY)
  }

  const getItemText = (item) => {
    const timeStart = timeMinute.offset(new Date(item.dateTime), period === 'minutes' ? -15 : -60)
    const timeEnd = new Date(item.dateTime)
    const formatTime12 = timeFormat(period === 'minutes' ? '%-I:%M%p' : '%-I%p')
    return {
      value: item.isValid ? item.value + 'mm' + (item.isLatest ? ' latest' : '') : 'No data',
      period: `${formatTime12(timeStart).toLowerCase()} - ${formatTime12(timeEnd).toLowerCase()}`,
      monthShort: timeFormat('%e %b')(timeEnd),
      monthLong: timeFormat('%e %B')(timeEnd)
    }
  }

  const getDataItemByX = (x) => {
    const dateTime = scaleBandInvert(xScale)(x)
    dataItem = dataPage.find(x => x.dateTime === dateTime)
    locatorBackground.classed('locator__background--visible', false)
  }

  const getNextDataItemIndex = (key) => {
    let index = dataPage.findIndex(x => x === dataItem)
    if (key === 'Home') {
      index = positiveDataItems[positiveDataItems.length - 1]
    } else if (key === 'End') {
      index = positiveDataItems[0]
    } else if (key === 'ArrowRight') {
      for (let i = index; i > 0; i--) {
        if (dataPage[i - 1].value > 0 || dataPage[i - 1].isLatest) {
          index = i - 1
          break
        }
      }
    } else {
      for (let i = index; i < dataPage.length - 1; i++) {
        if (dataPage[i + 1].value > 0 || dataPage[i + 1].isLatest) {
          index = i + 1
          break
        }
      }
    }
    return index
  }

  const swapCell = (e) => {
    const nextIndex = getNextDataItemIndex(e.key)
    const cell = e.target
    const nextCell = cell.parentNode.children[nextIndex]
    // cell.setAttribute('focusable', false)
    // nextCell.setAttribute('focusable', true)
    cell.tabIndex = -1
    nextCell.tabIndex = 0
    nextCell.focus()
    dataItem = dataPage[nextIndex]
  }

  const hideTooltip = () => {
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    tooltip.classed('tooltip--visible', false)
    locator.classed('locator--visible', false)
    locatorLine.classed('locator__line--visible', false)
    locatorBackground.classed('locator__background--visible', false)
  }
  const updateGrid = (colcount, total, hours, days, start, end) => {
    // Update grid properites
    grid.attr('aria-rowcount', 1)
    grid.attr('aria-colcount', colcount)
    description.innerHTML = `
    Showing ${hours > 24 ? days : hours} ${hours > 24 ? 'days' : 'hours'}
    from ${timeFormat('%e %B %Y at %-I:%M%p')(start)} to ${timeFormat('%e %B %Y at %-I:%M%p')(end)} in ${period === 'hours' ? 'hourly' : '15 minute'} totals.
    There was ${total > 0 ? total.toFixed(1) + 'mm' : 'no rainfall'} in this period.
  `
    const hasLatest = !!dataPage.find(x => x.isLatest)
    description.innerHTML += hasLatest ? `Last reading received at ${timeFormat('%-I:%M%p, %e %B %Y')(new Date(dataCache.latestDateTime))}` : ''
  }

  const getDataPage = (start, end) => {
    dataStart = new Date(dataCache.dataStartDateTime)
    const cacheStart = new Date(dataCache.cacheStartDateTime)
    const cacheEnd = new Date(dataCache.cacheEndDateTime)
    const pageStart = new Date(start)
    const pageEnd = new Date(end)
    // If page dates are outside cache range then load another data cache
    if (pageStart.getTime() < cacheStart.getTime() || pageEnd.getTime() > cacheEnd.getTime()) {
      // Rebuild the cache when we have more data
      // Set cache start and end
      // Set page start and end
      // Load new data and reinitialise the chart
      // New XMLHttp request
      return
    }
    // Determine which resolution and telemetry set to use
    const pageDuration = pageEnd.getTime() - pageStart.getTime()
    const pageDurationHours = Math.floor(pageDuration / (1000 * 60 * 60))
    const pageDurationDays = Math.floor(pageDuration / (1000 * 60 * 60 * 24))
    for (let i = 0; i < bands.length; i++) {
      if (pageDurationDays <= bands[i].days) {
        period = bands[i].period
        dataPage = dataCache[period].values
        latestDateTime = dataCache[period].latestDateTime
        break
      }
    }
    // Get the durartion between values, typically 15 or 60 mins
    const valueStart = new Date(dataPage[1].dateTime)
    const valueEnd = new Date(dataPage[0].dateTime)
    const valueDuration = valueEnd.getTime() - valueStart.getTime()
    // Remove items outside page range
    dataPage = dataPage.filter(x => {
      const date = new Date(x.dateTime)
      return date.getTime() > (pageStart.getTime() + valueDuration) && date.getTime() <= (pageEnd.getTime() + valueDuration)
    })
    // Add latest and valid properties to items
    forEach(dataPage, item => {
      item.isLatest = (new Date(item.dateTime)).getTime() === (new Date(latestDateTime)).getTime()
      item.isValid = (new Date(item.dateTime)).getTime() <= (new Date(latestDateTime)).getTime()
    })
    // Set current data item depending on paging direction and presence of latest reading
    dataItem = dataPage.find(x => x.isLatest)
    positiveDataItems = dataPage.map((x, i) => { return x.value > 0 || x.isLatest ? i : -1 }).filter(x => x >= 0)
    if (direction && positiveDataItems.length) {
      dataItem = direction === 'forward' ? dataPage[positiveDataItems[positiveDataItems.length - 1]] : dataPage[positiveDataItems[0]]
    }
    // Update html control properties
    updateResolutionControls({ bands, dataCache, dataStart, period, resolutionControlGroup })
    updatePagination({
      start: pageStart,
      end: pageEnd,
      duration: pageDuration,
      dataStart,
      paginationControlGroup: pagination,
      pageForward,
      pageForwardText,
      pageForwardDescription,
      pageBack,
      pageBackText,
      pageBackDescription
    })
    const totalPageRainfall = dataPage.reduce((a, b) => { return a + b.value }, 0)
    const pageValueStart = new Date(new Date(dataPage[dataPage.length - 1].dateTime).getTime() - valueDuration)
    const pageValueEnd = new Date(dataPage[0].dateTime)
    updateGrid(positiveDataItems.length, totalPageRainfall, pageDurationHours, pageDurationDays, pageValueStart, pageValueEnd)
  }

  const scaleBandInvert = (scale) => {
    // D3 doesnt currently support inverting of a scaleBand
    const domain = scale.domain()
    const paddingOuter = scale(domain[0])
    const eachBand = scale.step()
    return function (value) {
      const index = Math.floor(((value - paddingOuter) / eachBand))
      return domain[Math.max(0, Math.min(index, domain.length - 1))]
    }
  }

  const formatLabelsX = (d, i, nodes) => {
    // Format X Axis labels
    const element = select(nodes[i])
    // const formattedTime = timeFormat(period === 'hours' ? '%-I%p' : '%-I:%M%p')(new Date(d)).toLocaleLowerCase()
    const formattedTime = timeFormat('%-I%p')(new Date(d)).toLocaleLowerCase()
    const formattedDate = timeFormat('%-e %b')(new Date(d))
    element.append('tspan').text(formattedTime)
    element.append('tspan').attr('x', 0).attr('dy', '15').text(formattedDate)
  }

  const initChart = () => {
    // Get page data
    getDataPage(pageStart, pageEnd)
    // Render bars and chart
    renderChart()
    hideTooltip()
    // Show default tooltip
    if (dataItem && dataItem.isLatest) showTooltip()
  }

  //
  // Setup
  //

  const container = document.querySelector(`#${containerId}`)

  // Description
  const description = document.createElement('span')
  description.className = 'govuk-visually-hidden'
  description.setAttribute('aria-live', 'polite')
  description.setAttribute('id', 'bar-chart-description')
  container.appendChild(description)

  // Add controls container
  const controls = document.createElement('div')
  controls.className = 'defra-chart-controls'
  container.appendChild(controls)

  // Data resolutions in days, ascending order
  const bands = [
    { period: 'minutes', label: '24 hours', days: 1 },
    { period: 'hours', label: '5 days', days: 5 }
  ]

  // Add time scale buttons
  const resolutionControlGroup = createResolutionControls({ bands })
  controls.appendChild(resolutionControlGroup)

  // Create chart container elements
  const svg = select(`#${containerId}`).append('svg')
    .attr('aria-label', 'Bar chart')
    .attr('aria-describedby', 'bar-chart-description')
    .attr('focusable', 'false')

  // Clip path to visually hide text
  const clipText = svg.append('defs').append('clipPath').attr('id', 'clip-text').append('rect').attr('x', 0).attr('y', 0)

  // Add x and y grid containers
  svg.append('g').attr('class', 'y grid').attr('aria-hidden', true)
  svg.append('g').attr('class', 'x axis').attr('aria-hidden', true)
  svg.append('g').attr('class', 'y axis').attr('aria-hidden', true)

  // Add locator
  const locator = svg.append('g').attr('class', 'locator').attr('aria-hidden', true)
  const locatorBackground = locator.append('rect').attr('class', 'locator__background')
  const locatorLine = locator.append('line').attr('class', 'locator__line')

  // Add container for bars
  const grid = svg.append('g').attr('role', 'grid').attr('clip-path', 'url(#clip-text)')
  const gridRow = grid.append('g').attr('role', 'row')

  // Add tooltip container
  const tooltip = svg.append('g').attr('class', 'tooltip').attr('aria-hidden', true)
  const tooltipPath = tooltip.append('path').attr('class', 'tooltip-bg')
  const tooltipText = tooltip.append('text').attr('class', 'tooltip-text')
  const tooltipValue = tooltipText.append('tspan').attr('class', 'tooltip-text__strong')
  const tooltipDescription = tooltipText.append('tspan').attr('class', 'tooltip-text__small')

  // Add paging control
  const {
    pagination,
    pageForward,
    pageForwardText,
    pageForwardDescription,
    pageBack,
    pageBackText,
    pageBackDescription
  } = createPaginationControls()

  controls.appendChild(pagination)

  // Set defaults
  let width, height, xScale, yScale, dataStart, dataPage, dataItem, latestDateTime, period, positiveDataItems, direction, interfaceType
  // let isMobile

  // Get mobile media query list
  // const mobileMediaQuery = window.matchMedia('(max-width: 640px)')

  // Default page size is 5 days
  let pageStart = new Date()
  let pageEnd = new Date()
  pageStart.setHours(pageStart.getHours() - (bands.find(x => x.period === 'hours').days * 24))
  pageStart = pageStart.toISOString().replace(/.\d+Z$/g, 'Z')
  pageEnd = pageEnd.toISOString().replace(/.\d+Z$/g, 'Z')

  // XMLHttpRequest to get data if hasn't already been passed through
  const dataCache = data
  initChart()
  // if (dataCache) {
  //   initChart()
  // } else {
  //   const cacheStart = pageStart
  //   const cacheEnd = pageEnd
  //   xhr(`/service/telemetry-rainfall/${stationId}/${cacheStart}/${cacheEnd}`, (err, response) => {
  //     if (err) {
  //       console.log('Error: ' + err)
  //     } else {
  //       dataCache = response
  //     }
  //   }, 'json')
  // }

  //
  // Events
  //

  // mobileMediaQuery.addEventListener('change', renderChart)

  window.addEventListener('resize', () => {
    renderChart()
    if (dataItem) showTooltip()
  })

  container.addEventListener('click', (e) => {
    const button = e.target.closest('.defra-chart-controls__button')
    if (!button) return
    if (button.getAttribute('aria-disabled') === 'true') {
      const description = button.querySelector('.govuk-visually-hidden')
      description.innerText = ''
      window.setTimeout(() => {
        description.innerText = button.dataset.direction === 'back' ? 'No previous data' : 'No more data'
      }, 100)
      return
    }
    direction = button.getAttribute('data-direction')
    pageStart = new Date(button.getAttribute('data-start'))
    pageEnd = new Date(button.getAttribute('data-end'))
    initChart()
  })

  document.addEventListener('keyup', (e) => {
    const keys = ['Tab']
    if (!(e.target.getAttribute('role') === 'cell' && keys.includes(e.key))) return
    e.preventDefault()
    showTooltip()
  })

  document.addEventListener('keydown', (e) => {
    interfaceType = 'keyboard'
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!(e.target.getAttribute('role') === 'cell' && keys.includes(e.key))) return
    e.preventDefault()
    swapCell(e)
    showTooltip()
  })

  container.addEventListener('focusout', (e) => {
    if (e.target.getAttribute('role') !== 'cell') return
    if (dataItem && dataItem.isLatest) {
      showTooltip()
    } else {
      hideTooltip()
    }
  })

  svg.on('mousemove', (e) => {
    if (!xScale) return
    if (interfaceType === 'touch') {
      interfaceType = 'mouse'
      return
    }
    interfaceType = 'mouse'
    getDataItemByX(pointer(e)[0])
    showTooltip(pointer(e)[1])
  })

  svg.on('mouseleave', (e) => {
    if (dataPage) {
      dataItem = dataPage.find(x => x.isLatest)
      dataItem ? showTooltip() : hideTooltip()
    }
  })

  svg.on('touchstart', (e) => {
    interfaceType = 'touch'
    const touchEvent = e.targetTouches[0]
    if (!xScale) return
    getDataItemByX(pointer(touchEvent)[0])
    showTooltip(10)
  })

  svg.on('touchmove', (e) => {
    const touchEvent = e.targetTouches[0]
    if (!xScale) return
    getDataItemByX(pointer(touchEvent)[0])
    showTooltip(10)
  })

  this.container = container
}

// This sets the default value to be shown as the start point of a days data on the xAxis using the 24 hour clock
const DISPLAYED_HOUR_ON_X_AXIS = 6

function LineChart (containerId, stationId, data, options = {}) {
  const renderChart = () => {
    // Set scales
    setScaleX()
    setScaleY()

    // Set right margin depending on length of labels
    const numChars = yScale.domain()[1].toFixed(1).length - 2
    margin = { top: 5, bottom: 45, left: 15, right: (isMobile ? 31 : 36) + (numChars * 9) }

    // Get width and height
    const containerBoundingRect = container.getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.left - margin.right
    height = Math.floor(containerBoundingRect.height) - margin.top - margin.bottom

    // Calculate new xScale and yScales height and width
    xScale.range([0, width])
    yScale.range([height, 0])

    // Draw axis
    const xAxis = axisBottom().tickSizeOuter(0)

    // DB: Time offset
    xAxis.scale(xScale).ticks(timeHour.filter(d => { return d.getHours() === DISPLAYED_HOUR_ON_X_AXIS })).tickFormat('')

    yAxis = axisLeft().ticks(5).tickFormat(d => {
      return parseFloat(d).toFixed(1)
    }).tickSizeOuter(0)
    yAxis.scale(yScale)

    // Position axis bottom and right
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').attr('transform', 'translate(' + width + ', 0)').call(yAxis)

    // Format X Axis ticks
    svg.select('.x.axis').selectAll('text').each(formatLabelsX)

    // Position y ticks
    svg.select('.y.axis').style('text-anchor', 'start')
    svg.selectAll('.y.axis .tick line').attr('x2', DISPLAYED_HOUR_ON_X_AXIS)
    svg.selectAll('.y.axis .tick text').attr('x', 9)

    // DB: Time offset
    svg.select('.x.grid')
      .attr('transform', 'translate(0,' + height + ')')
      .call(axisBottom(xScale)
        .ticks(timeHour.filter(d => { return d.getHours() === DISPLAYED_HOUR_ON_X_AXIS }))
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
    const timeX = Math.floor(xScale(new Date()))
    svg.select('.time-line').attr('y1', 0).attr('y2', height)
    timeLine.attr('y1', 0).attr('y2', height).attr('transform', 'translate(' + timeX + ',0)')
    timeLabel.attr('y', height + 9).attr('transform', 'translate(' + timeX + ',0)')
      .attr('dy', '0.71em')
      .attr('x', isMobile ? -20 : -24)

    // X Axis time label
    timeLabel.select('.time-now-text__time').text(timeFormat('%-I:%M%p')(new Date()).toLowerCase())
    timeLabel.select('.time-now-text__date').text(timeFormat('%-e %b')(new Date()))

    // Add height to locator line
    svg.select('.locator-line').attr('y1', 0).attr('y2', height)

    // Draw lines and areas
    if (dataCache.observed.length) {
      observedArea.datum(observedPoints).attr('d', area)
      observedLine.datum(observedPoints).attr('d', line)
    }
    if (dataCache.forecast.length) {
      forecastArea.datum(forecastPoints).attr('d', area)
      forecastLine.datum(forecastPoints).attr('d', line)
    }

    // Add thresholds
    thresholdsContainer.selectAll('*').remove()
    thresholds.forEach(threshold => {
      const thresholdContainer = thresholdsContainer
        .append('g').attr('class', 'threshold')
        .classed('threshold--selected', !!threshold.isSelected)
        .attr('data-id', threshold.id)
        .attr('data-threshold', '')
      thresholdContainer.append('rect')
        .attr('class', 'threshold__bg')
        .attr('aria-hidden', true)
        .attr('x', 0).attr('y', -10).attr('height', 20)
        .attr('width', xScale(xExtent[1]))
      thresholdContainer.append('line')
        .attr('class', 'threshold__line')
        .attr('aria-hidden', true)
        .attr('x2', xScale(xExtent[1])).attr('y2', 0)
      const label = thresholdContainer.append('g')
        .attr('class', 'threshold-label')
      const path = label.append('path')
        .attr('aria-hidden', true)
        .attr('class', 'threshold-label__bg')
      const text = label.append('text')
        .attr('class', 'threshold-label__text')
      text.append('tspan').attr('font-size', 0).text('Threshold: ')
      text.append('tspan').attr('x', 10).attr('y', 22).text(`${threshold.level}m ${threshold.name}`)
      const textWidth = Math.round(text.node().getBBox().width)
      path.attr('d', `m-0.5,-0.5 l${textWidth + 20},0 l0,36 l-${((textWidth + 20) / 2) - 7.5},0 l-7.5,7.5 l-7.5,-7.5 l-${((textWidth + 20) / 2) - 7.5},0 l0,-36 l0,0`)
      label.attr('transform', `translate(${Math.round(width / 2 - ((textWidth + 20) / 2))}, -46)`)
      const remove = thresholdContainer.append('a')
        .attr('role', 'button')
        .attr('class', 'threshold__remove')
        .attr('tabindex', 0)
        .attr('data-threshold-remove', '')
        .attr('aria-label', `Remove ${threshold.level}m threshold (Visual only)`)
        .attr('aria-controls', `${containerId}-visualisation`)
        .attr('transform', 'translate(20,0)')
      remove.append('circle').attr('class', 'threshold__remove-bg').attr('r', 16).attr('x1', -5).attr('y1', -5)
      remove.append('circle').attr('class', 'threshold__remove-button').attr('r', 11)
      remove.append('line').attr('x1', -3).attr('y1', -3).attr('x2', 3).attr('y2', 3)
      remove.append('line').attr('y1', -3).attr('x2', -3).attr('x1', 3).attr('y2', 3)
      // Set individual elements size and position
      thresholdContainer.attr('transform', 'translate(0,' + Math.round(yScale(threshold.level)) + ')')
    })

    // Update clip text
    // clipText.attr('width', width + 5).attr('height', height)

    // Add significant points
    significantContainer.selectAll('*').remove()
    const significantObserved = observedPoints.filter(x => x.isSignificant).map(p => ({ ...p, type: 'observed' }))
    const significantForecast = forecastPoints.filter(x => x.isSignificant).map(p => ({ ...p, type: 'forecast' }))
    significantPoints = significantObserved.concat(significantForecast)
    const significantCells = significantContainer
      .attr('aria-rowcount', 1)
      .attr('aria-colcount', significantPoints.length)
      .selectAll('.point').data(significantPoints).enter()
      .append('g')
      .attr('role', 'gridcell')
      .attr('class', d => { return 'point point--' + d.type })
      .attr('tabindex', (d, i) => i === significantPoints.length - 1 ? 0 : -1)
      .attr('data-point', '')
      .attr('data-index', (d, i) => { return i })
    significantCells.append('circle').attr('aria-hidden', true)
      .attr('r', '5')
      .attr('cx', d => xScale(new Date(d.dateTime)))
      .attr('cy', d => yScale(dataCache.type === 'river' && d.value < 0 ? 0 : d.value))
    significantCells.insert('text')
      .attr('x', d => xScale(new Date(d.dateTime)))
      .attr('y', d => yScale(dataCache.type === 'river' && d.value < 0 ? 0 : d.value))
      .text(d => {
        const value = `${dataCache.type === 'river' && d.value < 0 ? 0 : d.value.toFixed(2)}m`
        const time = timeFormat('%-I:%M%p')(new Date(d.dateTime)).toLowerCase()
        const date = timeFormat('%e %b')(new Date(d.dateTime))
        return `${value} ${time}, ${date}`
      })

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

  const getNextDataItemIndex = (e) => {
    let index = parseInt(e.target.getAttribute('data-index'), 10)
    const first = 0
    const last = significantPoints.length - 1
    if (e.key === 'Home') {
      index = first
    } else if (e.key === 'End') {
      index = last
    } else if (e.key === 'ArrowRight') {
      index = index < last ? index += 1 : last
    } else if (e.key === 'ArrowLeft') {
      index = index > first ? index -= 1 : first
    }
    return index
  }

  const swapCell = (e) => {
    // Add threshold
    const nextIndex = getNextDataItemIndex(e)
    const cell = e.target
    const nextCell = cell.parentNode.children[nextIndex]
    cell.setAttribute('focusable', false)
    cell.removeAttribute('id')
    nextCell.setAttribute('focusable', true)
    // nextCell.id = 'focussed-cell'
    cell.tabIndex = -1
    nextCell.tabIndex = 0
    nextCell.focus()
    dataPoint = significantPoints[nextIndex]
    // Below needed to change zIndex of focussed point
  }

  const getDataPointByX = (x) => {
    const mouseDate = xScale.invert(x)
    const bisectDate = bisector((d) => { return new Date(d.dateTime) }).left
    const i = bisectDate(lines, mouseDate, 1) // returns the index to the current data item
    const d0 = lines[i - 1]
    const d1 = lines[i] || lines[i - 1]
    // Determine which date value is closest to the mouse
    const d = mouseDate - new Date(d0.dateTime) > new Date(d1.dateTime) - mouseDate ? d1 : d0
    dataPoint = d
  }

  const setTooltipPosition = (x, y) => {
    // Set Background size
    const text = tooltip.select('text')
    const txtHeight = Math.round(text.node().getBBox().height) + 23
    const pathLength = 140
    const pathCentre = `M${pathLength},${txtHeight}l0,-${txtHeight}l-${pathLength},0l0,${txtHeight}l${pathLength},0Z`
    // Set tooltip layout
    tooltipText.attr('x', 0).attr('y', 20)
    tooltipPath.attr('d', pathCentre)
    // Centre tooltip
    x -= pathLength / 2
    if (x <= 0) {
      // tooltip on the left
      x = 0
    } else if (x + pathLength >= (width + margin.right) - 15) {
      // tooltip on the right
      x = (width + margin.right) - 15 - pathLength
    }
    // Set background above or below position
    const tooltipHeight = tooltipPath.node().getBBox().height
    const tooltipMarginTop = 10
    const tooltipMarginBottom = height - (tooltipHeight + 10)
    // Tooltip 40 px above cursor
    y -= tooltipHeight + 40
    y = y < tooltipMarginTop ? tooltipMarginTop : y > tooltipMarginBottom ? tooltipMarginBottom : y
    tooltip.attr('transform', 'translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ')')
    tooltip.classed('tooltip--visible', true)
    // Update locator
    const locatorX = Math.floor(xScale(new Date(dataPoint.dateTime)))
    const locatorY = Math.floor(yScale(dataCache.type === 'river' && dataPoint.value < 0 ? 0 : dataPoint.value)) // *DBL
    const isForecast = (new Date(dataPoint.dateTime)) > (new Date(dataCache.latestDateTime))
    locator.classed('locator--forecast', isForecast)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')
  }

  const showTooltip = (tooltipY = 10) => {
    if (!dataPoint) return
    // Hide threshold label
    thresholdsContainer.select('.threshold--selected .threshold-label').style('visibility', 'hidden')
    // Set tooltip text
    const value = dataCache.type === 'river' && (Math.round(dataPoint.value * 100) / 100) <= 0 ? '0' : dataPoint.value.toFixed(2) // *DBL below zero addition
    tooltipValue.text(`${value}m`) // *DBL below zero addition
    tooltipDescription.text(`${timeFormat('%-I:%M%p')(new Date(dataPoint.dateTime)).toLowerCase()}, ${timeFormat('%e %b')(new Date(dataPoint.dateTime))}`)
    // Set locator properties
    locator.classed('locator--visible', true)
    // Update tooltip left/right background
    const tooltipX = xScale(new Date(dataPoint.dateTime))
    setTooltipPosition(tooltipX, tooltipY)
  }

  const hideTooltip = () => {
    tooltip.classed('tooltip--visible', false)
    locator.classed('locator--visible', false)
  }

  const showThreshold = (threshold) => {
    thresholdsContainer.selectAll('.threshold').classed('threshold--selected', false)
    threshold.classed('threshold--selected', true)
    // svg.select('.focussed-cell').remove()
  }

  const hideThreshold = () => {
    thresholdsContainer.selectAll('.threshold').classed('threshold--selected', false)
  }

  const addThreshold = (threshold) => {
    // Update thresholds array
    thresholds = thresholds.filter((x) => { return x.id !== threshold.id })
    thresholds.forEach(x => { x.isSelected = false })
    threshold.isSelected = true
    thresholds.push(threshold)
    thresholds.sort((a, b) => (a.level <= b.level) ? 1 : -1)
    // Re-render
    renderChart()
  }

  const removeThreshold = (id) => {
    // Update thresholds array
    thresholds = thresholds.filter(x => x.id.toString() !== id)
    if (thresholds.length) thresholds[0].isSelected = true
    // Re-render
    renderChart()
  }

  const setScaleX = () => {
    // Set x scale extent
    xExtent = extent(dataCache.observed.concat(dataCache.forecast), (d, i) => { return new Date(d.dateTime) })
    // Increase x extent by 5% from now value
    let date = new Date()
    const percentile = Math.round(Math.abs(xExtent[0] - date) * 0.05)
    date = new Date(Number(date) + Number(percentile))
    const xRange = [xExtent[0], xExtent[1]]
    xRange.push(date)
    xExtent[0] = Math.min.apply(Math, xRange)
    xExtent[1] = Math.max.apply(Math, xRange)
    // Set x input domain
    xScaleInitial = scaleTime().domain(xExtent)
    xScaleInitial.range([0, width])
    xScale = scaleTime().domain(xExtent)
  }

  const setScaleY = () => {
    // Extend or reduce y extent
    const maxThreshold = Math.max.apply(Math, thresholds.map((x) => { return x.level }))
    const minThreshold = Math.min.apply(Math, thresholds.map((x) => { return x.level }))
    const maxData = Math.max(maxThreshold, yExtentDataMax)
    const minData = Math.min(minThreshold, yExtentDataMin)
    // Add 1/3rd or range above and below, capped at zero for non-negative ranges
    let range = maxData - minData
    range = range < 1 ? 1 : range
    const yRangeUpperBuffered = (maxData + (range / 3))
    const yRangeLowerBuffered = (minData - (range / 3))
    yExtent[1] = yExtentDataMax <= yRangeUpperBuffered ? yRangeUpperBuffered : yExtentDataMax
    yExtent[0] = dataCache.type === 'river' ? (yRangeLowerBuffered < 0 ? 0 : yRangeLowerBuffered) : yRangeLowerBuffered
    // Set min y axis to 1 metre
    yExtent[1] = yExtent[1] < 1 ? 1 : yExtent[1]
    // Update y scale
    yScale = scaleLinear().domain(yExtent).nice(5)
    yScale.range([height, 0])
    // Update y axis
    yAxis = axisLeft()
    yAxis.ticks(5).tickFormat((d) => { return parseFloat(d).toFixed(2) + 'm' })
    yAxis.scale(yScale)
  }

  const getDataPage = (start, end) => {
    const cacheStart = new Date(dataCache.cacheStartDateTime)
    const cacheEnd = new Date(dataCache.cacheEndDateTime)
    const pageStart = new Date(start)
    const pageEnd = new Date(end)

    // If page dates are outside cache range then load another data cache
    if (pageStart.getTime() < cacheStart.getTime() || pageEnd.getTime() > cacheEnd.getTime()) {
      // Rebuild the cache when we have more data
      // Set cache start and end
      // Set page start and end
      // Load new data and reinitialise the chart
      // New XMLHttp request
      return
    }

    // To follow
    // Determine which resolution and range to display
    // Using raw data for now

    // Setup array to combine observed and forecast points and identify startPoint for locator
    if (dataCache.observed.length) {
      // Add isSignificant property to points
      // Simply function could be improved using dynamic tolerance to better place key points
      dataCache.observed = simplify(dataCache.observed, dataCache.type === 'tide' ? 10000000 : 1000000)
      const errorFilter = l => !l.err
      const errorAndNegativeFilter = l => errorFilter(l) // *DBL below zero addition
      const filterNegativeValues = ['groundwater', 'tide', 'sea'].includes(dataCache.type) ? errorFilter : errorAndNegativeFilter
      lines = dataCache.observed.filter(filterNegativeValues).map(l => ({ ...l, type: 'observed' })).reverse()
      dataPoint = lines[lines.length - 1] || null
    }
    if (dataCache.forecast.length) {
      // Add isSignificant property to points
      dataCache.forecast = simplify(dataCache.forecast, dataCache.type === 'tide' ? 10000000 : 1000000)
      // Set 1st forecast isSignificant to false if it is the same time and value as the latest observed
      const latestTime = (new Date(dataCache.observed[0].dateTime).getTime())
      const forecastStartTime = (new Date(dataCache.forecast[0].dateTime).getTime())
      const latestValue = dataCache.observed[0].value
      const forecastStartValue = dataCache.forecast[0].value
      const isSame = latestTime === forecastStartTime && latestValue === forecastStartValue
      dataCache.forecast[0].isSignificant = !isSame
      // Merge points
      lines = lines.concat(dataCache.forecast.map(l => ({ ...l, type: 'forecast' })))
    }

    // Get reference to oberved and forecast sections
    observedPoints = lines.filter(l => l.type === 'observed')
    forecastPoints = lines.filter(l => l.type === 'forecast')

    // Create area generator
    area = d3Area().curve(curveMonotoneX)
      .x(d => { return xScale(new Date(d.dateTime)) })
      .y0(d => { return height })
      .y1(d => { return yScale(dataCache.type === 'river' && d.value < 0 ? 0 : d.value) }) // *DBL below zero addition

    // Create line generator
    line = d3Line().curve(curveMonotoneX)
      .x((d) => { return xScale(new Date(d.dateTime)) })
      .y((d) => { return yScale(dataCache.type === 'river' && d.value < 0 ? 0 : d.value) }) // *DBL below zero addition

    // Note: xExtent uses observed and forecast data rather than lines for the scenario where river levels
    // start or end as -ve since we still need to determine the datetime span of the graph even if the
    // values are excluded from plotting by virtue of being -ve

    // Set reference to yExtent before any thresholds are added
    yExtent = extent(lines, (d, i) => { return d.value })
    yExtentDataMin = yExtent[0]
    yExtentDataMax = yExtent[1]
  }

  const formatLabelsX = (d, i, nodes) => {
    // Format X Axis labels
    const element = select(nodes[i])
    const formattedTime = timeFormat('%-I%p')(new Date(d.setHours(DISPLAYED_HOUR_ON_X_AXIS, 0, 0, 0))).toLocaleLowerCase()
    const formattedDate = timeFormat('%-e %b')(new Date(d))
    element.append('tspan').text(formattedTime)
    element.append('tspan').attr('x', 0).attr('dy', '15').text(formattedDate)
  }

  const initChart = () => {
    // Get page data
    getDataPage(pageStart, pageEnd)
    // Render chart
    renderChart()
  }

  //
  // Setup
  //

  const defaults = {
    btnAddThresholdClass: 'defra-button-text-s'
  }
  options = Object.assign({}, defaults, options)

  const container = document.getElementById(containerId)

  // Description
  const description = document.createElement('span')
  description.className = 'govuk-visually-hidden'
  description.setAttribute('aria-live', 'polite')
  description.setAttribute('id', 'line-chart-description')
  container.appendChild(description)

  // Create chart container elements
  const svg = select(`#${containerId}`).append('svg')
    .attr('id', `${containerId}-visualisation`)
    .attr('aria-label', 'Line chart')
    .attr('aria-describedby', 'line-chart-description')
    .attr('focusable', 'false')

  // Clip path to visually hide text
  // const clipText = svg.append('defs').append('clipPath').attr('id', 'clip-text').append('rect').attr('x', -5).attr('y', 0)

  // Add grid containers
  svg.append('g').attr('class', 'y grid').attr('aria-hidden', true)
  svg.append('g').attr('class', 'x grid').attr('aria-hidden', true)
  svg.append('g').attr('class', 'x axis').attr('aria-hidden', true)
  svg.append('g').attr('class', 'y axis').attr('aria-hidden', true).style('text-anchor', 'start')

  // Add containers for observed and forecast lines
  const inner = svg.append('g').attr('class', 'inner').attr('aria-hidden', true) // .attr('clip-path', 'url(#clip-text)')
  inner.append('g').attr('class', 'observed observed-focus')
  inner.append('g').attr('class', 'forecast')
  const observedArea = inner.select('.observed').append('path').attr('class', 'observed-area')
  const observedLine = inner.select('.observed').append('path').attr('class', 'observed-line')
  const forecastArea = inner.select('.forecast').append('path').attr('class', 'forecast-area')
  const forecastLine = inner.select('.forecast').append('path').attr('class', 'forecast-line')

  // Add timeline
  const timeLine = svg.append('line').attr('class', 'time-line').attr('aria-hidden', true)
  const timeLabel = svg.append('text').attr('class', 'time-now-text').attr('aria-hidden', true)
  timeLabel.append('tspan').attr('class', 'time-now-text__time')
  timeLabel.append('tspan').attr('text-anchor', 'middle').attr('class', 'time-now-text__date').attr('x', 0).attr('dy', '15')

  // Add locator
  const locator = inner.append('g').attr('class', 'locator')
  locator.append('line').attr('class', 'locator-line')
  locator.append('circle').attr('r', 4.5).attr('class', 'locator-point')

  // Add thresholds and significant containers
  const thresholdsContainer = svg.append('g').attr('class', 'thresholds')
  const significantContainer = svg.append('g').attr('class', 'significant').attr('role', 'grid').append('g').attr('role', 'row') // .attr('clip-path', 'url(#clip-text)')

  // Add tooltip container
  const tooltip = svg.append('g').attr('class', 'tooltip').attr('aria-hidden', true)
  const tooltipPath = tooltip.append('path').attr('class', 'tooltip-bg')
  const tooltipText = tooltip.append('text').attr('class', 'tooltip-text')
  const tooltipValue = tooltipText.append('tspan').attr('class', 'tooltip-text__strong').attr('x', 12).attr('dy', '0.5em')
  const tooltipDescription = tooltipText.append('tspan').attr('class', 'tooltip-text').attr('x', 12).attr('dy', '1.4em')

  // Add optional 'Add threshold' buttons
  document.querySelectorAll('[data-threshold-add]').forEach(container => {
    const button = document.createElement('button')
    button.className = options.btnAddThresholdClass
    button.innerHTML = `Show<span class="govuk-visually-hidden"> ${container.getAttribute('data-level')}m threshold</span> on chart <span class="govuk-visually-hidden">(Visual only)</span>`
    button.setAttribute('aria-controls', `${containerId}-visualisation`)
    button.setAttribute('data-id', container.getAttribute('data-id'))
    button.setAttribute('data-threshold-add', '')
    button.setAttribute('data-level', container.getAttribute('data-level'))
    button.setAttribute('data-name', container.getAttribute('data-name'))
    container.parentElement.replaceChild(button, container)
  })

  // Define globals
  let isMobile, interfaceType, nextFocusElement
  let dataPoint
  let width, height, margin, xScaleInitial, xScale, yScale, xExtent, yAxis, yExtent, yExtentDataMin, yExtentDataMax
  let lines, area, line, observedPoints, forecastPoints, significantPoints
  let thresholds = []

  // Create a mobile width media query
  const mobileMediaQuery = window.matchMedia('(max-width: 640px)')
  isMobile = mobileMediaQuery.matches

  // Default page size is 5 days
  let pageStart = new Date()
  let pageEnd = new Date()
  pageStart.setHours(pageStart.getHours() - (5 * 24))
  pageStart = pageStart.toISOString().replace(/.\d+Z$/g, 'Z')
  pageEnd = pageEnd.toISOString().replace(/.\d+Z$/g, 'Z')

  // XMLHttpRequest to get data if hasn't already been passed through
  const dataCache = data
  initChart()

  //
  // Public methods
  //

  this.removeThreshold = (id) => {
    removeThreshold(id)
  }

  this.addThreshold = (threshold) => {
    addThreshold(threshold)
  }

  this.chart = container

  //
  // Events
  //

  // addListener deprectaed but required or ie11 and Safari < 14
  mobileMediaQuery[mobileMediaQuery.addEventListener ? 'addEventListener' : 'addListener']('change', (e) => {
    isMobile = e.matches
    hideTooltip()
    renderChart()
  })

  window.addEventListener('resize', () => {
    // touchmove/scroll on mobile devices also fires resize
    if (interfaceType === 'touch') return
    hideTooltip()
    renderChart()
  })

  document.addEventListener('click', (e) => {
    // Hide points and focussed cell
    significantContainer.node().parentNode.classList.remove('significant--visible')
    // svg.select('.focussed-cell').remove()
    // Add threshold button
    if (!e.target.hasAttribute('data-threshold-add')) return
    const button = e.target
    addThreshold({
      id: button.getAttribute('data-id'),
      level: Number(button.getAttribute('data-level')),
      name: button.getAttribute('data-name')
    })
    // Scroll upto chart from add threshold button
    const y = container.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo(0, y)
  })

  document.addEventListener('keydown', (e) => {
    interfaceType = 'keyboard'
    const gridKeys = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!(e.target.classList.contains('point') && gridKeys.includes(e.key))) return // DB: Needs to be more specific
    e.preventDefault()
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    swapCell(e)
    showTooltip(10)
  })

  document.addEventListener('keyup', (e) => {
    // Show points if within line chart
    const significantParent = significantContainer.node().parentNode
    significantParent.classList.toggle('significant--visible', !!e.target.closest('.defra-line-chart'))
    // Threshold
    if (e.target.closest('[data-threshold]')) {
      const threshold = e.target.closest('[data-threshold]')
      // Remove threshold
      if (['Enter', 'Space'].includes(e.key)) {
        const id = threshold.getAttribute('data-id')
        removeThreshold(id)
        const index = thresholds.findIndex(x => x.id.toString() === id)
        const nextId = index < thresholds.length - 1 ? thresholds[index + 1].id : null
        if (nextFocusElement) {
          nextFocusElement.focus()
        } else if (nextId) {
          const nextThreshold = document.querySelector(`[data-threshold][data-id="${nextId}"]`)
          showThreshold(select(nextThreshold))
          nextFocusElement = nextThreshold.querySelector('a')
        } else {
          nextFocusElement = document.querySelector('[data-point][tabindex="0"]')
        }
      } else {
        // Select threshold
        hideTooltip()
        showThreshold(select(threshold))
        nextFocusElement = threshold.querySelector('a')
      }
      nextFocusElement.focus()
      nextFocusElement = null
      return
    }
    // Select point
    if (e.target.hasAttribute('data-point')) {
      if (e.key === 'Tab') {
        swapCell(e)
        hideThreshold()
        showTooltip(10)
      }
      return
    }
    // Add threshold button
    if (e.target.hasAttribute('data-threshold-add') && ['Enter', 'Space'].includes(e.key)) {
      nextFocusElement = e.target
      const thresholdId = e.target.getAttribute('data-id')
      const thresholdRemoveButton = document.querySelector(`.threshold[data-id="${thresholdId}"] a`)
      thresholdRemoveButton.focus()
      return
    }
    // Outside chart
    hideTooltip()
    const threshold = thresholds.find(x => x.isSelected)
    if (threshold) {
      // Reinstate default threshold?
      showThreshold(thresholdsContainer.select(`[data-id="${threshold.id}"]`))
    }
    // Hide significant points
    significantContainer.node().parentNode.classList.remove('significant--visible')
    // Remove focussed significant point
  }, true)

  container.addEventListener('mouseleave', (e) => {
    hideTooltip()
    const threshold = thresholds.find(x => x.isSelected)
    if (threshold) {
      showThreshold(thresholdsContainer.select(`[data-id="${threshold.id}"`))
    }
  })

  svg.on('click', (e) => {
    if (e.target.closest('.threshold')) return
    getDataPointByX(pointer(e)[0])
    hideThreshold()
    showTooltip(pointer(e)[1])
  })

  let lastClientX, lastClientY
  svg.on('mousemove', (e) => {
    // Safari bug where modifier keys trigger mousemove
    if (lastClientX === e.clientX && lastClientY === e.clientY) return
    lastClientX = e.clientX
    lastClientY = e.clientY
    if (!xScale || e.target.closest('.threshold')) return
    if (interfaceType === 'touch') {
      interfaceType = 'mouse'
      return
    }
    interfaceType = 'mouse'
    getDataPointByX(pointer(e)[0])
    hideThreshold()
    showTooltip(pointer(e)[1])
  })

  svg.on('touchstart', (e) => {
    interfaceType = 'touch'
  })

  svg.on('touchmove', (e) => {
    if (!xScale || e.target.closest('.threshold')) return
    const touchEvent = e.targetTouches[0]
    const elementOffsetX = svg.node().getBoundingClientRect().left
    getDataPointByX(pointer(touchEvent)[0] - elementOffsetX)
    hideThreshold()
    showTooltip(10)
  })

  svg.on('touchend', (e) => {
    interfaceType = null
  })

  thresholdsContainer.on('click', (e) => {
    e.stopPropagation()
    const thresholdContainer = e.target.closest('.threshold')
    if (e.target.closest('.threshold__remove')) {
      removeThreshold(thresholdContainer.getAttribute('data-id'))
    } else if (thresholdContainer) {
      hideTooltip()
      showThreshold(select(thresholdContainer))
    }
  })

  thresholdsContainer.on('mouseover', (e) => {
    const thresholdContainer = e.target.closest('.threshold')
    if (thresholdContainer) {
      hideTooltip()
      showThreshold(select(thresholdContainer))
    }
  })
}

window.flood.charts = {
  createBarChart: (containerId, stationId, data = null) => {
    return new BarChart(containerId, stationId, data)
  },
  createLineChart: (containerId, stationId, data) => {
    return new LineChart(containerId, stationId, data)
  }
}

// Create bar chart
if (document.getElementById('bar-chart')) {
  window.flood.charts.createBarChart('bar-chart', window.flood.model.stationId, window.flood.model.telemetry)
}

// Line chart
if (document.getElementById('line-chart')) {
  const lineChart = window.flood.charts.createLineChart('line-chart', window.flood.model.id, window.flood.model.telemetry)
  const thresholdId = 'threshold-pc5'
  const threshold = document.querySelector(`[data-id="${thresholdId}"]`)
  if (threshold) {
    lineChart.addThreshold({
      id: thresholdId,
      name: threshold.getAttribute('data-name'),
      level: Number(threshold.getAttribute('data-level'))
    })
  }
}
