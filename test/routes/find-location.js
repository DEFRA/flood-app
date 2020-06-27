'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - find-location', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })

    const findLocationPlugin = {
      plugin: {
        name: 'fine-location',
        register: (server, options) => {
          server.route(require('../../server/routes/find-location'))
        }
      }
    }

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(findLocationPlugin)
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
    const regex = /.\/server\/models\/./
    Object.keys(require.cache).forEach((key) => {
      if (key.match(regex)) {
        delete require.cache[key]
      }
    })
  })
  lab.test('GET /find-location', async () => {
    const options = {
      method: 'GET',
      url: '/find-location'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('POST- payload of warrington /find-location', async () => {
    const options = {
      method: 'POST',
      url: '/find-location',
      payload: {
        location: 'warrington'
      }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
  })
  lab.test('POST- blank payload, error message displayed /find-location', async () => {
    const options = {
      method: 'POST',
      url: '/find-location',
      payload: {
        location: ''
      }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('Enter a real town, city or postcode')
  })
  lab.test('POST- payload fails joi regex validation, error message displayed /find-location', async () => {
    const options = {
      method: 'POST',
      url: '/find-location',
      payload: {
        location: '£$%^£$^%%$£'
      }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('Enter a real town, city or postcode')
  })
})
