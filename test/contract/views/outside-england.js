'use strict'

const path = require('path')
const nunjucks = require('nunjucks')
const Lab = require('@hapi/lab')

const { expect } = require('@hapi/code')

const { describe, it, before } = exports.lab = Lab.script()

const { parse } = require('node-html-parser')

async function renderPage (context = {}) {
  const viewsPath = path.join(__dirname, '../../../server/views')
  const govukPath = path.join(__dirname, '../../../node_modules/govuk-frontend/dist/govuk')
  const macrosPath = path.join(__dirname, '../../../node_modules/govuk-frontend/dist/govuk/components')

  const env = nunjucks.configure([viewsPath, govukPath, macrosPath], {
    baseUrl: '/',
    autoescape: true,
    noCache: true
  })

  return env.render('outside-england.html', context)
}

describe('Contract - Views - outside England', () => {
  describe('outside England page', () => {
    let outsideEnglandPage
    before(async () => {
      outsideEnglandPage = await renderPage({ model: { pageTitle: 'Error: Find location - Check for flooding - GOV.UK' } })
    })
    it('should render the page with a message informing users the service is only available in England', async () => {
      const message = parse(outsideEnglandPage).querySelector('.govuk-heading-xl').text
      expect(message).to.include('This service is for locations in England')
    })
    it('should provide a link to search for a location in England', async () => {
      const link = parse(outsideEnglandPage).querySelector('#search-england-link')
      expect(link.getAttribute('href')).to.equal('/')
    })
    it('should provide links to the equivalent services in Scotland, Wales and Northern Ireland', async () => {
      const scotlandLink = parse(outsideEnglandPage).querySelector('#scottish-flooding-link')
      const walesLink = parse(outsideEnglandPage).querySelector('#wales-flooding-link')
      const northernIrelandLink = parse(outsideEnglandPage).querySelector('#northern-ireland-flooding-link')
      expect(scotlandLink).to.exist()
      expect(walesLink).to.exist()
      expect(northernIrelandLink).to.exist()
    })
    it('should ensure the links to other national services have the correct href attributes', async () => {
      const scotlandLink = parse(outsideEnglandPage).querySelector('#scottish-flooding-link')
      const walesLink = parse(outsideEnglandPage).querySelector('#wales-flooding-link')
      const northernIrelandLink = parse(outsideEnglandPage).querySelector('#northern-ireland-flooding-link')
      expect(scotlandLink.getAttribute('href')).to.equal('https://www.sepa.org.uk/environment/water/flooding/')
      expect(walesLink.getAttribute('href')).to.equal('https://naturalresources.wales/flooding')
      expect(northernIrelandLink.getAttribute('href')).to.equal('https://www.nidirect.gov.uk/articles/check-the-risk-of-flooding-in-your-area')
    })
    it('should set the page title to "Error: Find location - Check for flooding - GOV.UK"', async () => {
      const title = parse(outsideEnglandPage).querySelector('title').text
      expect(title).to.contain('Error: Find location - Check for flooding - GOV.UK')
    })
  })
})
