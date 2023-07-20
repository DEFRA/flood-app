
export function createPaginationControls () {
  const pagination = document.createElement('div')
  pagination.className = 'defra-chart-pagination'
  const paginationInner = document.createElement('div')
  paginationInner.style.display = 'none'
  paginationInner.className = 'defra-chart-pagination_inner'
  const pageBack = document.createElement('button')
  pageBack.className = 'defra-chart-pagination__button defra-chart-pagination__button--back'
  pageBack.setAttribute('data-direction', 'back')
  pageBack.setAttribute('aria-controls', 'bar-chart')
  pageBack.setAttribute('aria-describedby', 'page-back-description')
  const pageBackText = document.createElement('span')
  pageBackText.className = 'defra-chart-pagination__text'
  pageBack.appendChild(pageBackText)
  const pageBackDescription = document.createElement('span')
  pageBackDescription.id = 'page-back-description'
  pageBackDescription.className = 'govuk-visually-hidden'
  pageBackDescription.setAttribute('aria-live', 'polite')
  pageBack.appendChild(pageBackDescription)
  const pageForward = document.createElement('button')
  pageForward.className = 'defra-chart-pagination__button defra-chart-pagination__button--forward'
  pageForward.setAttribute('data-direction', 'forward')
  pageForward.setAttribute('aria-controls', 'bar-chart')
  pageForward.setAttribute('aria-describedby', 'page-forward-description')
  const pageForwardText = document.createElement('span')
  pageForwardText.className = 'defra-chart-pagination__text'
  pageForward.appendChild(pageForwardText)
  const pageForwardDescription = document.createElement('span')
  pageForwardDescription.id = 'page-forward-description'
  pageForwardDescription.className = 'govuk-visually-hidden'
  pageForwardDescription.setAttribute('aria-live', 'polite')
  pageForward.appendChild(pageForwardDescription)
  paginationInner.appendChild(pageBack)
  paginationInner.appendChild(pageForward)
  pagination.appendChild(paginationInner)

  return {
    pagination,
    paginationInner,
    pageForward,
    pageForwardText,
    pageForwardDescription,
    pageBack,
    pageBackText,
    pageBackDescription
  }
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
  pageForwardText.innerText = 'Forward'
  pageBackText.innerText = 'Back'
  pageForwardDescription.innerText = ''
  pageBackDescription.innerText = ''
}
