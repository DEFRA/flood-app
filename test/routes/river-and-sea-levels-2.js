'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')

const data = require('../data')
const { initServer, initStubs } = require('../utils')

const { describe, it, beforeEach, afterEach, before, after } = exports.lab = Lab.script()

describe('river-and-sea-levels', () => {
  let server
  let sandbox
  let stubs

  before(async () => {
    server = await initServer({
      name: 'river',
      route: require('../../server/routes/river-and-sea-levels')
    })
  })

  beforeEach(() => {
    stubs = initStubs()
    sandbox = stubs.sandbox

    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    // stubs.getRiversByName.callsFake(() => [])
    stubs.getStationsWithin.callsFake(() => [])
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await server.stop()
  })

  describe('/river-and-sea-levels?q={query}', () => {
    it('should redirect to location page when using a valid query parameter (location)', async () => {
      stubs.getRiversByName.callsFake(() => [])
      stubs.getJson.callsFake(() => data.warringtonGetJson)

      const response = await server.inject({
        method: 'GET',
        url: '/river-and-sea-levels?q=warrington'
      })

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/river-and-sea-levels/warrington')
      expect(response.payload).to.equal('')
    })

    // it('should redirect to location page when using a valid query parameter (postcode)', async () => {
    //   stubs.getFloodsWithin.callsFake(() => data.floodsByPostCode)

    //   const response = await server.inject({
    //     method: 'GET',
    //     url: '/river-and-sea-levels?q=WA4%201HT'
    //   })

    //   expect(response.statusCode).to.equal(301)
    // })

    // it('should redirect to main page when using country query parameter', async () => {
    //   const response = await server.inject({
    //     method: 'GET',
    //     url: '/river-and-sea-levels?q=england'
    //   })

    //   expect(response.statusCode).to.equal(302)
    //   expect(response.headers.location).to.equal('/river-and-sea-levels')
    // })

    // it('should redirect to location page when using a valid non-england location query parameter', async () => {
    //   stubs.getJson.callsFake(() => data.scotlandGetJson)
    //   stubs.getIsEngland.callsFake(() => ({ is_england: false }))

    //   const response = await server.inject({
    //     method: 'GET',
    //     url: '/river-and-sea-levels?q=kinghorn'
    //   })

    //   expect(response.statusCode).to.equal(301)
    //   expect(response.headers.location).to.equal('/river-and-sea-levels/kinghorn-fife')
    // })

    // it('should 404 when using a non-location query parameter', async () => {
    //   const response = await server.inject({
    //     method: 'GET',
    //     url: '/river-and-sea-levels?q=not-found'
    //   })

    //   expect(response.statusCode).to.equal(404)
    //   expect(response.headers.location).to.equal(undefined)
    // })

    // it('should redirect to main page when using an empty query parameter', async () => {
    //   const response = await server.inject({
    //     method: 'GET',
    //     url: '/river-and-sea-levels?q='
    //   })

    //   expect(response.statusCode).to.equal(302)
    //   expect(response.headers.location).to.equal('river-and-sea-levels')
    // })

    // it('should strip out and redirect to location page when using invalid characters in query parameter', async () => {
    //   stubs.getJson.callsFake(() => data.warringtonGetJson)

    //   const response = await server.inject({
    //     method: 'GET',
    //     url: '/river-and-sea-levels?q=warrington%*_'
    //   })

    //   expect(response.statusCode).to.equal(301)
    //   expect(response.headers.location).to.equal('/river-and-sea-levels/warrington')
    // })

    // it('should 404 when using non-latin characters', async () => {
    //   const response = await server.inject({
    //     method: 'GET',
    //     url: '/river-and-sea-levels?q=你好'
    //   })

    //   expect(response.statusCode).to.equal(404)
    // })
  })

  // describe('/river-and-sea-levels/{location}', () => {
  //   it('should render location page when going to a location route', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/river-and-sea-levels/warrington'
  //     })

  //     expect(response.statusCode).to.equal(200)
  //     expect(getPageTitle(response.payload)).to.equal('Warrington - Find river, sea, groundwater and rainfall levels - GOV.UK')
  //     expect(getCanonicalUrl(response.payload)).to.equal('http://localhost:3000/river-and-sea-levels/warrington')
  //   })

  //   it('should redirect to main page when using country as a location', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/river-and-sea-levels/england'
  //     })

  //     expect(response.statusCode).to.equal(302)
  //     expect(response.headers.location).to.equal('/river-and-sea-levels')
  //   })

  //   it('should 404 when going to a non-location route', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/river-and-sea-levels/not-found'
  //     })

  //     expect(response.statusCode).to.equal(404)
  //   })

  //   it('should 404 when going to a non-england location', async () => {
  //     stubs.getJson.callsFake(() => data.scotlandGetJson)
  //     stubs.getIsEngland.callsFake(() => ({ is_england: false }))

  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/river-and-sea-levels/kinghorn-fife'
  //     })

  //     expect(response.statusCode).to.equal(404)
  //   })
  // })

  // describe('POST /river-and-sea-levels', () => {
  //   it('should redirect to location page', async () => {
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels',
  //       payload: {
  //         location: 'warrington'
  //       }
  //     })

  //     expect(response.statusCode).to.equal(301)
  //     expect(response.headers.location).to.equal('/river-and-sea-levels/warrington')
  //   })

  //   it('should render main page when using country payload', async () => {
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels',
  //       payload: {
  //         location: 'england'
  //       }
  //     })

  //     expect(response.statusCode).to.equal(302)
  //     expect(response.headers.location).to.equal('/river-and-sea-levels')
  //   })

  //   it('should render main page when using invalid payload', async () => {
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels',
  //       payload: {
  //         river: 'test'
  //       }
  //     })

  //     expect(response.statusCode).to.equal(302)
  //     expect(response.headers.location).to.equal('river-and-sea-levels')
  //   })

  //   it('should render main page when using an empty payload', async () => {
  //     stubs.getJson.callsFake(() => data.nonLocationGetJson)

  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels',
  //       payload: {
  //         location: ''
  //       }
  //     })

  //     expect(response.statusCode).to.equal(200)
  //   })

  //   it('should render main page with no payload', async () => {
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels'
  //     })

  //     expect(response.statusCode).to.equal(302)
  //   })

  //   it('should render location not found page with limit exceeding payload', async () => {
  //     stubs.getJson.callsFake(() => data.nonLocationGetJson)

  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels',
  //       payload: {
  //         location: new Array(201).join('x')
  //       }
  //     })

  //     expect(response.statusCode).to.equal(200)
  //     expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
  //   })

  //   it('should render location not found page with a non-location payload', async () => {
  //     stubs.getJson.callsFake(() => data.nonLocationGetJson)

  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels',
  //       payload: {
  //         location: 'not-found'
  //       }
  //     })

  //     expect(response.statusCode).to.equal(200)
  //     expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
  //   })

  //   it('should render location not found page with a non-england location payload', async () => {
  //     stubs.getJson.callsFake(() => data.scotlandGetJson)
  //     stubs.getIsEngland.callsFake(() => ({ is_england: false }))

  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/river-and-sea-levels',
  //       payload: {
  //         location: 'kinghorn'
  //       }
  //     })

  //     expect(response.statusCode).to.equal(200)
  //     expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
  //   })
  // })

  // describe('/river-and-sea-levels data', () => {
  //   it('should render only groundwater levels')
  // })
})
