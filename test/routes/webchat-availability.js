'use strict'

const proxyquire = require('proxyquire').noCallThru()
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
// const getAvailability = require('@defra/flood-webchat/dist/server')
// const getAvailability = async () => {
//   return { available: true }
// }

describe('webchat-availability', () => {
  let server, getAvailabilityStub

  async function setup () {
    getAvailabilityStub = sinon.stub()
    const route = proxyquire('../../server/routes/webchat-availability', {
      '@defra/flood-webchat/dist/server': getAvailabilityStub

    })
    const plugin = {
      plugin: {
        name: 'webchat-availability',
        register: (server, options) => {
          server.route(route)
        }
      }
    }
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register(plugin)
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()
  }
  beforeEach(async () => {
    server = Hapi.server({
      port: 3000,
      host: 'localhost',
      routes: {
        validate: {
          options: {
            abortEarly: false,
            stripUnknown: true
          }
        }
      }
    })
    setup()
  })
  afterEach(async () => {
    await server.stop()
    await sinon.restore()
  })
  it('should pass expected arguments to getAvailability', async () => {
    const options = {
      method: 'GET',
      url: '/webchat-availability'
    }

    const availability = {
      date: '2024-02-26T18:17:36.540Z',
      availability: 'AVAILABLE'
    }

    getAvailabilityStub.resolves(availability)

    sinon.stub(process, 'env').value({
      CXONE_CLIENT_ID: 'client id',
      CXONE_CLIENT_SECRET: 'client secret',
      CXONE_ACCESS_KEY: 'access key',
      CXONE_ACCESS_SECRET: 'access secret',
      CXONE_SKILL_ENDPOINT: 'skill endpoint',
      CXONE_HOURS_ENDPOINT: 'hours endpoint',
      CXONE_MAX_QUEUE_COUNT: 'max queue count'
    })
    const expectedArgs = {
      clientId: 'client id',
      clientSecret: 'client secret',
      accessKey: 'access key',
      accessSecret: 'access secret',
      skillEndpoint: 'skill endpoint',
      hoursEndpoint: 'hours endpoint',
      maxQueueCount: 'max queue count'
    }
    const response = await server.inject(options)

    expect(getAvailabilityStub.calledOnce).to.true()
    expect(getAvailabilityStub.firstCall.args[0]).to.equal(expectedArgs)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.equal(JSON.stringify(availability))
  })
  it('should handle exceptions gracefully', async () => {
    const options = {
      method: 'GET',
      url: '/webchat-availability'
    }

    getAvailabilityStub.rejects('Error')

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.equal(JSON.stringify({}))
  })
})
