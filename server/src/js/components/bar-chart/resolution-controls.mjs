
const { forEach } = window.flood.utils

export function createResolutionControls ({ bands }) {
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-chart-resolution-controls'
  for (let i = bands.length - 1; i >= 0; i--) {
    const band = bands[i]
    const control = document.createElement('button')

    const start = new Date()
    const end = new Date()
    start.setHours(start.getHours() - (bands.find(({ period }) => period === band.period).days * 24))

    control.className = 'defra-chart-resolution-controls__button'
    control.style.display = 'none'
    control.innerText = band.label
    control.setAttribute('data-period', band.period)
    control.setAttribute('data-start', start.toISOString().replace(/.\d+Z$/g, 'Z'))
    control.setAttribute('data-end', end.toISOString().replace(/.\d+Z$/g, 'Z'))
    control.setAttribute('aria-controls', 'bar-chart')

    segmentedControl.appendChild(control)
  }
  return segmentedControl
}

export function updateResolutionControls ({ bands, dataCache, dataStart, period, segmentedControl }) {
  const now = new Date()
  const dataDurationDays = (new Date(now.getTime() - dataStart.getTime())) / (1000 * 60 * 60 * 24)
  // Check there are at least 2 telemetry arrays
  let numBands = 0
  for (let i = 0; i < bands.length; i++) {
    numBands += Object.getOwnPropertyDescriptor(dataCache, bands[i].period) ? 1 : 0
  }
  // Determine which controls to display
  forEach(segmentedControl.querySelectorAll('.defra-chart-resolution-controls__button'), button => {
    const isBand = period === button.getAttribute('data-period')
    const band = bands.find(x => x.period === button.getAttribute('data-period'))
    button.checked = isBand
    button.style.display = (band.days <= dataDurationDays) && numBands > 1 ? 'inline-block' : 'none'
    button.classList.toggle('defra-chart-resolution-controls__button--selected', isBand)
  })
}
