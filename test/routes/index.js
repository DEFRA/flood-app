'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Get Routes test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3009,
      host: 'localhost'
    })
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('GET /start-page', async () => {
    const plugin = {
      plugin: {
        name: 'start-page',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('Check if a location in England is at risk of flooding now')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })

  lab.test('GET /sms-auto-opt-in-info', async () => {
    const plugin = {
      plugin: {
        name: 'sms-auto-opt-in-info',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('This phone number has been automatically opted-in to receive flood warnings')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /what-to-do-in-a-flood', async () => {
    const plugin = {
      plugin: {
        name: 'what-to-do-in-a-flood',
        register: (server, options) => {
          server.route(require('../../server/routes/what-to-do-in-a-flood'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/what-to-do-in-a-flood'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('What the flood warnings mean')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /plan-ahead-for-flooding', async () => {
    const plugin = {
      plugin: {
        name: 'plan-ahead-for-flooding',
        register: (server, options) => {
          server.route(require('../../server/routes/plan-ahead-for-flooding'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/plan-ahead-for-flooding'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('How to plan ahead for flooding')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /what-happens-after-a-flood', async () => {
    const plugin = {
      plugin: {
        name: 'what-happens-after-a-flood',
        register: (server, options) => {
          server.route(require('../../server/routes/what-happens-after-a-flood'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/what-happens-after-a-flood'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('What happens after a flood')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /recovering-after-a-flood', async () => {
    const plugin = {
      plugin: {
        name: 'recovering-after-a-flood',
        register: (server, options) => {
          server.route(require('../../server/routes/recovering-after-a-flood'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(plugin)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/recovering-after-a-flood'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('How to recover after a flood')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /find-location', async () => {
    const plugin = {
      plugin: {
        name: 'find-location',
        register: (server, options) => {
          server.route(require('../../server/routes/find-location'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(plugin)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/find-location'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /cookies', async () => {
    const plugin = {
      plugin: {
        name: 'cookies',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('cookies')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })

  lab.test('GET /terms-and-conditions', async () => {
    const plugin = {
      plugin: {
        name: 'terms-and-conditions',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('terms and conditions')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /privacy-notice', async () => {
    const plugin = {
      plugin: {
        name: 'privacy-notice',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('Privacy notice')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })

  lab.test('GET /api/places.geojson', async () => {
    const plugin = {
      plugin: {
        name: 'places.geojson',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('GET /how-we-measure-river-sea-groundwater-levels', async () => {
    const plugin = {
      plugin: {
        name: 'about-levels',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('How we measure river, sea and groundwater levels')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('GET /accessibility-statement', async () => {
    const plugin = {
      plugin: {
        name: 'accessibility-statement',
        register: (server, options) => {
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
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('<h1 class="govuk-heading-xl">Accessibility statement for Check for flooding</h1>')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
})
