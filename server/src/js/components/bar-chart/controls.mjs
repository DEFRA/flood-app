
const { forEach } = window.flood.utils

export function updateSegmentedControl ({ bands, dataCache, dataStart, period, segmentedControl }) {
  const now = new Date()
  const dataDurationDays = (new Date(now.getTime() - dataStart.getTime())) / (1000 * 60 * 60 * 24)
  // Check there are at least 2 telemetry arrays
  let numBands = 0
  for (let i = 0; i < bands.length; i++) {
    numBands += Object.getOwnPropertyDescriptor(dataCache, bands[i].period) ? 1 : 0
  }
  // Determine which controls to display
  forEach(segmentedControl.querySelectorAll('.defra-chart-segmented-control input'), input => {
    const isBand = period === input.getAttribute('data-period')
    const band = bands.find(x => x.period === input.getAttribute('data-period'))
    input.checked = isBand
    input.parentNode.style.display = (band.days <= dataDurationDays) && numBands > 1 ? 'inline-block' : 'none'
    input.parentNode.classList.toggle('defra-chart-segmented-control__segment--selected', isBand)
  })
}

export function updatePagination ({
  start, end, duration, durationHours, dataStart, paginationInner,
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
  paginationInner.style.display = (nextStart || previousEnd) ? 'inline-block' : 'none'
  pageForward.setAttribute('data-start', nextStart)
  pageForward.setAttribute('data-end', nextEnd)
  pageBack.setAttribute('data-start', previousStart)
  pageBack.setAttribute('data-end', previousEnd)
  pageForward.setAttribute('aria-disabled', !(nextStart && nextEnd))
  pageBack.setAttribute('data-journey-click', 'Rainfall:Chart Interaction:Rainfall - Previous 24hrs')
  pageForward.setAttribute('data-journey-click', 'Rainfall:Chart Interaction:Rainfall - Next 24hrs')
  pageBack.setAttribute('aria-disabled', !(previousStart && previousEnd))
  pageForwardText.innerText = `Next ${durationHours > 1 ? durationHours : duration} ${durationHours > 1 ? 'hours' : 'minutes'}`
  pageBackText.innerText = `Previous ${durationHours > 1 ? durationHours : duration} ${durationHours > 1 ? 'hours' : 'minutes'}`
  pageForwardDescription.innerText = ''
  pageBackDescription.innerText = ''
}
