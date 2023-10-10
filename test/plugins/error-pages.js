'use strict'

const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const boom = require('@hapi/boom')
const { expect } = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
lab.experiment('error-pages plugin test', () => {
  let sandbox
  let server
  let logSpy
  let fakeResponse

  lab.beforeEach(async () => {
    logSpy = sinon.spy()
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register({
      plugin: {
        name: 'find-location',
        register: (server) => server.route({
          method: 'GET',
          path: '/some/root',
          handler: (request) => {
            request.log = logSpy
            return fakeResponse
          }
        })
      }
    })
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.res
  })

  lab.test('Plugin error-pages successfully handles 404s', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }
    fakeResponse = boom.notFound('something went wrong')

    const response = await server.inject(options)

    expect(logSpy.lastCall.args[0]).to.equal('debug')
    expect(response.statusCode).to.equal(404)
    expect(response.payload).to.include('Page not found')
  })

  lab.test('Plugin error-pages successfully moves 400s with the message \'Invalid request params input\' to 404 pages', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }
    fakeResponse = boom.badRequest('Invalid request params input')

    const response = await server.inject(options)

    expect(logSpy.lastCall.args[0]).to.equal('debug')
    expect(response.statusCode).to.equal(404)
    expect(response.payload).to.include('Page not found')
  })

  lab.test('Plugin error-pages successfully handles rate limited requests', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }
    fakeResponse = boom.tooManyRequests(new Error('too many requests'))

    const response = await server.inject(options)

    expect(logSpy.lastCall.args[0]).to.equal('warn')
    expect(response.statusCode).to.equal(429)
    expect(response.payload).to.include('Too many requests made for this page')
  })

  lab.test('Plugin error-pages successfully handles 5xx errors', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }
    fakeResponse = boom.internal(new Error('something wrong'))

    const response = await server.inject(options)

    expect(logSpy.lastCall.args[0]).to.equal('error')
    expect(response.statusCode).to.equal(500)
    expect(response.payload).to.include('Sorry, there is a problem with the service')
  })
})
