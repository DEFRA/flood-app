
const { forEach } = window.flood.utils

export function createSegmentedControl ({ bands }) {
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-chart-segmented-control'
  for (let i = bands.length - 1; i >= 0; i--) {
    const control = document.createElement('div')
    control.className = 'defra-chart-segmented-control__segment'
    control.style.display = 'none'
    let start = new Date()
    let end = new Date()
    start.setHours(start.getHours() - (bands.find(x => x.period === bands[i].period).days * 24))
    start = start.toISOString().replace(/.\d+Z$/g, 'Z')
    end = end.toISOString().replace(/.\d+Z$/g, 'Z')
    control.innerHTML = `
      <input class="defra-chart-segmented-control__input" name="time" type="radio" id="time${bands[i].label}" data-period="${bands[i].period}" data-start="${start}" data-end="${end}" aria-controls="bar-chart"/>
      <label for="time${bands[i].label}">${bands[i].label}</label>
    `
    segmentedControl.appendChild(control)
  }
  return segmentedControl
}

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
