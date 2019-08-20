'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Get Routes test', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3009,
      host: 'localhost'
    })

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/router'))
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('1 - GET /consent', async () => {
    const options = {
      method: 'GET',
      url: '/consent'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('Give your consent before using the flood information service prototype')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('2 - GET /start-page', async () => {
    const options = {
      method: 'GET',
      url: '/start-page'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('Check if a location in England is at risk of flooding now')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('3 - GET /location-not-england', async () => {
    const options = {
      method: 'GET',
      url: '/location-not-england'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('This service provides flood warning information for England only')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('4 - GET /sms-auto-opt-in-info', async () => {
    const options = {
      method: 'GET',
      url: '/sms-auto-opt-in-info'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('This phone number has been automatically opted-in to receive flood warnings')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('5 - GET /what-to-do-in-a-flood/what-the-flood-warnings-mean', async () => {
    const options = {
      method: 'GET',
      url: '/what-to-do-in-a-flood/what-the-flood-warnings-mean'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('What the flood warnings mean')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('6 - GET /plan-ahead-for-flooding', async () => {
    const options = {
      method: 'GET',
      url: '/plan-ahead-for-flooding'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('How to plan ahead for flooding')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('7 - GET /what-happens-after-a-flood', async () => {
    const options = {
      method: 'GET',
      url: '/what-happens-after-a-flood'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('What happens after a flood')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('8 - GET /recovering-after-a-flood', async () => {
    const options = {
      method: 'GET',
      url: '/recovering-after-a-flood'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('How to recover after a flood')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('9 - GET /what-to-do-in-a-flood/getting-a-flood-alert', async () => {
    const options = {
      method: 'GET',
      url: '/what-to-do-in-a-flood/getting-a-flood-alert'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('What the flood warnings mean')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('10 - GET /what-to-do-in-a-flood/getting-a-flood-warning', async () => {
    const options = {
      method: 'GET',
      url: '/what-to-do-in-a-flood/getting-a-flood-warning'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('What the flood warnings mean')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('11 - GET /what-to-do-in-a-flood/getting-a-severe-flood-warning', async () => {
    const options = {
      method: 'GET',
      url: '/what-to-do-in-a-flood/getting-a-severe-flood-warning'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('What the flood warnings mean')
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('12 - GET /', async () => {
    const options = {
      method: 'GET',
      url: '/'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
})
