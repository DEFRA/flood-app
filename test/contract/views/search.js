'use strict'

const path = require('path')
const nunjucks = require('nunjucks')
const { JSDOM } = require('jsdom')
const Lab = require('@hapi/lab')
const sinon = require('sinon')
const { expect } = require('@hapi/code')

const { describe, it } = exports.lab = Lab.script()

const { parse } = require('node-html-parser')

function renderSearchPartial (context = {}) {
  const viewsPath = path.resolve(__dirname, '../../../server/views')

  const govukPath = path.resolve(__dirname, '../../../node_modules/govuk-frontend/dist/govuk')

  const env = nunjucks.configure([viewsPath, govukPath], {
    autoescape: true,
    noCache: true
  })

  const errorMessage = '{% from "components/error-message/macro.njk" import govukErrorMessage %}'
  const errorSummary = '{% from "components/error-summary/macro.njk" import govukErrorSummary %}'

  const templateString = `${errorMessage}${errorSummary}{% include "partials/search.html" %}`
  return env.renderString(templateString, context)
}

describe('Contract - Views - search partial', () => {
  it('should render base form behavior without requiring JavaScript', async () => {
    const html = renderSearchPartial()
    const dom = new JSDOM(html)
    const { document } = dom.window

    const form = document.querySelector('form')
    const searchButton = document.querySelector('.defra-search__button--search')
    const locationButton = document.getElementById('use-location-btn')
    const geolocationInput = document.getElementById('geolocation')

    expect(form).to.exist()
    expect(form.getAttribute('method')).to.equal('post')
    expect(form.getAttribute('autocomplete')).to.equal('off')

    expect(searchButton).to.exist()
    expect(searchButton.getAttribute('type')).to.equal('submit')

    expect(geolocationInput).to.exist()
    expect(geolocationInput.getAttribute('type')).to.equal('hidden')
    expect(geolocationInput.getAttribute('name')).to.equal('geolocation')
    expect(geolocationInput.getAttribute('value')).to.equal('')

    expect(locationButton).to.exist()
    expect(locationButton.classList.contains('defra-search__location-button')).to.equal(true)
    expect(locationButton.classList.contains('app-show-with-js')).to.equal(true)
    expect(locationButton.classList.contains('js-enabled')).to.equal(false)
  })

  it('should make the location button JS-enabled when JavaScript runs', async () => {
    const html = renderSearchPartial()
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'http://localhost'
    })

    const locationButton = dom.window.document.getElementById('use-location-btn')

    expect(locationButton.classList.contains('defra-search__location-button')).to.equal(true)
    expect(locationButton.classList.contains('app-show-with-js')).to.equal(true)
    expect(locationButton.classList.contains('js-enabled')).to.equal(true)
  })

  it('should call geolocation and submit the form when use-location button is pressed', async () => {
    const html = renderSearchPartial()
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'http://localhost'
    })

    const { window } = dom
    const { document } = window
    const form = document.querySelector('form')
    const geolocationInput = document.getElementById('geolocation')

    const submitSpy = sinon.spy()
    form.submit = submitSpy

    const geolocationStub = sinon.stub().callsFake((onSuccess) => {
      onSuccess({
        coords: {
          latitude: 51.5007,
          longitude: -0.1246
        }
      })
    })

    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition: geolocationStub },
      configurable: true
    })

    document.getElementById('use-location-btn').click()

    expect(geolocationStub.calledOnce).to.equal(true)
    expect(geolocationInput.value).to.equal('51.5007,-0.1246')
    expect(submitSpy.calledOnce).to.equal(true)
  })

  it('should insert an error summary and error message if geolocation is unavailable', async () => {
    const html = renderSearchPartial({ model: { errorMessage: 'Turn on location services to use your current location, or enter a town, city or postcode in England' } })

    const root = parse(html)
    const formGroup = root.querySelector('.defra-search')
    const errorSummary = root.querySelector('.govuk-error-summary')
    const errorSummaryCustom = root.querySelector('.defra-search__error-summary')
    const errorMessage = root.querySelector('.govuk-error-message')
    const errorMessageCustom = root.querySelector('.defra-search__error-message')

    expect(formGroup).to.exist()
    expect(formGroup.classNames.includes('govuk-form-group--error')).to.equal(true)
    expect(errorSummary).to.exist()
    expect(errorSummaryCustom).to.exist()
    expect(errorSummary.textContent).to.contain('Turn on location services to use your current location, or enter a town, city or postcode in England')
    expect(errorMessage).to.exist()
    expect(errorMessageCustom).to.exist()
    expect(errorMessage.getAttribute('id')).to.equal('geolocation-error')
    expect(errorMessage.textContent).to.contain('Turn on location services to use your current location, or enter a town, city or postcode in England')
  })

  it('should not show the error summary or error message if there is no error', async () => {
    const html = renderSearchPartial({ model: { errorMessage: null } })

    const root = parse(html)
    const errorSummary = root.querySelector('.govuk-error-summary')
    const errorMessage = root.querySelector('.govuk-error-message')

    expect(errorSummary).to.not.exist()
    expect(errorMessage).to.not.exist()
  })
})
