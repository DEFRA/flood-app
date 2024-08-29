'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')

const data = require('../data')
const { initServer, initStubs, getPageTitle, getCanonicalUrl } = require('../utils')

const { describe, it, beforeEach, afterEach, before, after } = exports.lab = Lab.script()

describe('alerts-and-warnings', () => {
  let server
  let sandbox
  let stubs

  before(async () => {
    server = await initServer({
      name: 'warnings',
      route: require('../../server/routes/alerts-and-warnings')
    })
  })

  beforeEach(() => {
    stubs = initStubs()
    sandbox = stubs.sandbox

    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getFloods.callsFake(() => ({ floods: [] }))
    stubs.getStationsWithin.callsFake(() => [])
    stubs.getImpactsWithin.callsFake(() => [])
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await server.stop()
  })

  describe('/alerts-and-warnings?q={query}', () => {
    it('should redirect to location page when using a valid query parameter (location)', async () => {
      stubs.getJson.callsFake(() => [])
      stubs.getJson.callsFake(() => data.warringtonGetJson)

      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q=warrington'
      })

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/alerts-and-warnings/warrington')
      expect(response.payload).to.equal('')
    })

    it('should redirect to location page when using a valid query parameter (postcode)', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getFloodsWithin.callsFake(() => data.floodsByPostCode)

      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q=WA4%201HT'
      })

      expect(response.statusCode).to.equal(301)
    })

    it('should redirect to main page when using country query parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q=england'
      })

      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('/alerts-and-warnings')
    })

    it('should redirect to location page when using a valid non-england location query parameter', async () => {
      stubs.getJson.callsFake(() => data.scotlandGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: false }))

      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q=kinghorn'
      })

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/alerts-and-warnings/kinghorn-burntisland-fife')
    })

    it('should 404 when using a non-location query parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q=not-found'
      })

      expect(response.statusCode).to.equal(404)
      expect(response.headers.location).to.equal(undefined)
    })

    it('should redirect to main page when using an empty query parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q='
      })

      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('alerts-and-warnings')
    })

    it('should strip out and redirect to location page when using invalid characters in query parameter', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)

      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q=warrington%*_'
      })

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/alerts-and-warnings/warrington')
    })

    it('should 404 when using non-latin characters', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings?q=你好'
      })

      expect(response.statusCode).to.equal(404)
    })
  })

  describe('/alerts-and-warnings/{location}', () => {
    it('should render location page when going to a location route', async () => {
      stubs.getJson
        .onFirstCall().returns(data.fakeFloodsData)

      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings/warrington'
      })

      expect(response.statusCode).to.equal(200)
      expect(getPageTitle(response.payload)).to.equal('Warrington - flood alerts and warnings - GOV.UK')
      expect(getCanonicalUrl(response.payload)).to.equal('http://localhost:3000/alerts-and-warnings/warrington')
    })

    it('should redirect to main page when using country as a location', async () => {
      stubs.getJson.callsFake().returns(data.nonLocationGetJson)

      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings/england'
      })

      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('/alerts-and-warnings')
    })

    it('should 404 when going to a non-location route', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings/not-found'
      })

      expect(response.statusCode).to.equal(404)
    })

    it('should 404 when going to a non-england location', async () => {
      stubs.getJson.callsFake(() => data.scotlandGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: false }))

      const response = await server.inject({
        method: 'GET',
        url: '/alerts-and-warnings/kinghorn-fife'
      })

      expect(response.statusCode).to.equal(404)
    })
  })

  describe('POST /alerts-and-warnings', () => {
    it('should redirect to location page', async () => {
      stubs.getJson.onCall(() => data.warringtonGetJson)

      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'warrington'
        }
      })

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/alerts-and-warnings/warrington')
    })

    it('should render main page when using country payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'england'
        }
      })

      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('/alerts-and-warnings')
    })

    it('should render main page when using invalid payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          river: 'test'
        }
      })

      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('alerts-and-warnings')
    })

    it('should render main page when using an empty payload', async () => {
      stubs.getJson.callsFake(() => data.fakeFloodsData)

      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: ''
        }
      })

      expect(response.statusCode).to.equal(200)
    })

    it('should render main page with no payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings'
      })

      expect(response.statusCode).to.equal(302)
    })

    it('should render location not found page with limit exceeding payload', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)

      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: new Array(201).join('x')
        }
      })

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should render location not found page with a non-location payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'not-found'
        }
      })

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should render location not found page with a non-england location payload', async () => {
      stubs.getJson.callsFake(() => data.scotlandGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: false }))

      const response = await server.inject({
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'kinghorn'
        }
      })

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
    })
  })
})
