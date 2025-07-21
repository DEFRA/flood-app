'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')

const proxyquire = require('proxyquire').noCallThru()
const { describe, it, before } = exports.lab = Lab.script()
const { URL } = require('url')

const HOST = 'https://example.gov.uk'

describe('Plugin - Request Logging', () => {
  let loggingPlugin

  before(() => {
    loggingPlugin = proxyquire('../../server/plugins/logging', {
      '../lib/logging/pino': {},
      'hapi-pino': {}
    })
  })

  it('should serialize req with query', async () => {
    const req = {
      url: new URL('/some/url', HOST),
      method: 'get',
      query: {
        q: 'hi'
      }
    }

    const actual = loggingPlugin.options.serializers.req(req)

    expect(actual).to.equal({
      url: '/some/url',
      method: 'GET',
      query: {
        q: 'hi'
      }
    })
  })

  it('should serialize req with an empty query', async () => {
    const req = {
      url: new URL('/some/url', HOST),
      method: 'get',
      header: {
        'x-api-key': '12345'
      },
      query: {}
    }

    const actual = loggingPlugin.options.serializers.req(req)

    expect(actual).to.equal({
      url: '/some/url',
      method: 'GET',
      query: undefined
    })
  })

  it('should serialize req without query', async () => {
    const req = {
      url: new URL('/some/url', HOST),
      method: 'get',
      header: {
        'x-api-key': '12345'
      }
    }

    const actual = loggingPlugin.options.serializers.req(req)

    expect(actual).to.equal({
      url: '/some/url',
      method: 'GET',
      query: undefined
    })
  })

  it('should serialize res', async () => {
    const res = {
      output: {
        statusCode: 200
      },
      header: {
        'x-api-key': '12345'
      }
    }

    const actual = loggingPlugin.options.serializers.res(res)

    expect(actual).to.equal({ statusCode: 200 })
  })

  it('should serialize err', async () => {
    const err = new TypeError('Something went boom')
    err.code = 'BOOM_0001'

    const actual = loggingPlugin.options.serializers.err(err)

    expect(actual).to.equal({
      name: 'TypeError',
      message: 'Something went boom',
      stack: err.stack,
      code: 'BOOM_0001'
    })
  })
})
