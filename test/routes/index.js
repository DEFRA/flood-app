'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

describe('Route - Index', () => {
  let sandbox
  let server

  beforeEach(async () => {
    sandbox = await sinon.createSandbox()

    server = Hapi.server({
      port: 3009,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  it('should redirect when visiting: /start-page', async () => {
    const plugin = {
      plugin: {
        name: 'start-page',
        register: (server) => {
          server.route(require('../../server/routes/start-page'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/start-page'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(301)
  })

  it('should 200 when visiting: /sms-auto-opt-in-info', async () => {
    const plugin = {
      plugin: {
        name: 'sms-auto-opt-in-info',
        register: (server) => {
          server.route(require('../../server/routes/sms-auto-opt-in-info'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/sms-auto-opt-in-info'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('This phone number has been automatically opted-in to receive flood warnings')
    expect(response.headers['content-type']).to.include('text/html')
  })

  it('should 200 when visiting: /cookies', async () => {
    const plugin = {
      plugin: {
        name: 'cookies',
        register: (server) => {
          server.route(require('../../server/routes/cookies'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/cookies'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('cookies')
    expect(response.headers['content-type']).to.include('text/html')
  })

  it('should 200 when visiting: /terms-and-conditions', async () => {
    const plugin = {
      plugin: {
        name: 'terms-and-conditions',
        register: (server) => {
          server.route(require('../../server/routes/terms-and-conditions'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/terms-and-conditions'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('terms and conditions')
    expect(response.headers['content-type']).to.include('text/html')
  })

  it('should 200 when visiting: /privacy-notice', async () => {
    const plugin = {
      plugin: {
        name: 'privacy-notice',
        register: (server) => {
          server.route(require('../../server/routes/privacy-notice'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/privacy-notice'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('Privacy notice')
    expect(response.headers['content-type']).to.include('text/html')
  })

  it('should 200 when visiting: /how-we-measure-river-sea-groundwater-levels', async () => {
    const plugin = {
      plugin: {
        name: 'about-levels',
        register: (server) => {
          server.route(require('../../server/routes/about-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/how-we-measure-river-sea-groundwater-levels'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('How we measure river, sea and groundwater levels')
    expect(response.headers['content-type']).to.include('text/html')
  })

  it('should 200 when visiting: /accessibility-statement', async () => {
    const plugin = {
      plugin: {
        name: 'accessibility-statement',
        register: (server) => {
          server.route(require('../../server/routes/accessibility-statement'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/accessibility-statement'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('<h1 class="govuk-heading-xl">Accessibility statement for Check for flooding</h1>')
    expect(response.headers['content-type']).to.include('text/html')
  })

  it('should 200 when visiting: /api/places.geojson', async () => {
    const plugin = {
      plugin: {
        name: 'places.geojson',
        register: (server) => {
          server.route(require('../../server/routes/api/places.geojson'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/api/places.geojson'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
  })
})
