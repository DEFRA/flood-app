'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

describe('Route - Redirects', () => {
  let server

  beforeEach(async () => {
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
  })

  it('should 301 redirect GET /find-location to /', async () => {
    server.route(require('../../server/routes/find-location'))
    await server.initialize()

    const response = await server.inject({ method: 'GET', url: '/find-location' })

    expect(response.statusCode).to.equal(301)
    expect(response.headers.location).to.equal('/')
  })

  it('should 301 redirect GET /plan-ahead-for-flooding to https://www.gov.uk/prepare-for-flooding', async () => {
    server.route(require('../../server/routes/plan-ahead-for-flooding'))
    await server.initialize()

    const response = await server.inject({ method: 'GET', url: '/plan-ahead-for-flooding' })

    expect(response.statusCode).to.equal(301)
    expect(response.headers.location).to.equal('https://www.gov.uk/prepare-for-flooding')
  })

  it('should 301 redirect GET /what-to-do-in-a-flood to https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do', async () => {
    server.route(require('../../server/routes/what-to-do-in-a-flood'))
    await server.initialize()

    const response = await server.inject({ method: 'GET', url: '/what-to-do-in-a-flood' })

    expect(response.statusCode).to.equal(301)
    expect(response.headers.location).to.equal('https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do')
  })

  it('should 301 redirect GET /recovering-after-a-flood to https://www.gov.uk/after-flood', async () => {
    server.route(require('../../server/routes/recovering-after-a-flood'))
    await server.initialize()

    const response = await server.inject({ method: 'GET', url: '/recovering-after-a-flood' })

    expect(response.statusCode).to.equal(301)
    expect(response.headers.location).to.equal('https://www.gov.uk/after-flood')
  })

  it('should 301 redirect GET /what-happens-after-a-flood to https://www.gov.uk/after-flood', async () => {
    server.route(require('../../server/routes/what-happens-after-a-flood'))
    await server.initialize()

    const response = await server.inject({ method: 'GET', url: '/what-happens-after-a-flood' })

    expect(response.statusCode).to.equal(301)
    expect(response.headers.location).to.equal('https://www.gov.uk/after-flood')
  })
})
