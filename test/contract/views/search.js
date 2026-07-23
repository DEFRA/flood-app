'use strict'

const path = require('path')
const nunjucks = require('nunjucks')
const { JSDOM } = require('jsdom')
const Lab = require('@hapi/lab')
const sinon = require('sinon')
const { expect } = require('@hapi/code')

const { describe, it } = exports.lab = Lab.script()

function renderSearchPartial () {
  const viewsPath = path.resolve(__dirname, '../../../server/views')
  const env = nunjucks.configure(viewsPath, {
    autoescape: true,
    noCache: true
  })

  return env.render('partials/search.html', {})
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

  it('should alert the user if geolocation is unavailable', async () => {
    const html = renderSearchPartial()
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'http://localhost'
    })

    const { window } = dom
    const alertSpy = sinon.spy()

    window.alert = alertSpy
    Object.defineProperty(window.navigator, 'geolocation', {
      value: undefined,
      configurable: true
    })

    window.document.getElementById('use-location-btn').click()

    expect(alertSpy.calledOnce).to.equal(true)
    expect(alertSpy.firstCall.args[0]).to.equal('Geolocation is not supported by this browser.')
  })
})
