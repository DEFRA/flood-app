const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, afterEach, before } = exports.lab = Lab.script()
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const mocks = {
  wreckGet: sinon.stub(),
  wreckPost: sinon.stub()
}

describe('Util - Request', () => {
  let util

  before(() => {
    util = proxyquire('../../server/util', {
      '@hapi/wreck': {
        defaults: () => ({
          get: mocks.wreckGet,
          post: mocks.wreckPost
        })
      }
    })
  })

  afterEach(() => {
    for (const stub of Object.values(mocks)) {
      stub.reset()
    }
  })

  it('should use acts as a proxy for the relevant wreck method', async () => {
    const getUrl = '/some/get/url'
    const postUrl = '/some/post/url'

    const requestOptions = {
      headers: {
        'some-header': 'some-value'
      }
    }

    const mockResponse = { res: { statusCode: 200, headers: {} }, payload: { ok: true } }

    mocks.wreckGet.resolves(mockResponse)
    mocks.wreckPost.resolves(mockResponse)

    const [
      getResult,
      postResult
    ] = await Promise.all([
      util.request('get', getUrl, requestOptions),
      util.request('post', postUrl, requestOptions)
    ])

    expect(mocks.wreckGet.callCount).to.equal(1)
    expect(mocks.wreckGet.firstCall.args).to.equal([getUrl, requestOptions])
    expect(getResult).to.equal(mockResponse.payload)

    expect(mocks.wreckPost.callCount).to.equal(1)
    expect(mocks.wreckPost.firstCall.args).to.equal([postUrl, requestOptions])
    expect(postResult).to.equal(mockResponse.payload)
  })

  it('should add the method and url (with query strings removed) to wreck request errors', async () => {
    const method = 'get'
    const url = '/some/get/url?a=1&b=2&key=secret&c=4'

    const requestOptions = {
      headers: {
        'some-header': 'some-value'
      }
    }

    const requestError = new Error('Response Error: some response error')

    mocks.wreckGet.rejects(requestError)

    let err

    try {
      await util.request(method, url, requestOptions)
    } catch (e) {
      err = e
    }

    expect(err.message).to.equal('Response Error: some response error on GET /some/get/url')
  })

  it('should not add the method and url to wreck non-request errors', async () => {
    const method = 'get'
    const url = '/some/get/url'

    const requestOptions = {
      headers: {
        'some-header': 'some-value'
      }
    }

    const requestError = new Error('some other error')

    mocks.wreckGet.rejects(requestError)

    let err

    try {
      await util.request(method, url, requestOptions)
    } catch (e) {
      err = e
    }

    expect(err.message).to.equal('some other error')
  })

  it('should throw a LocationSearchError if the \'x-ms-bm-ws-info\' response header has a value of \'1\'', async () => {
    const method = 'get'
    const url = '/some/get/url'

    const requestOptions = {
      headers: {
        'some-header': 'some-value'
      }
    }

    const mockResponse = { res: { statusCode: 200, headers: { 'x-ms-bm-ws-info': '1' } }, payload: { ok: true } }

    mocks.wreckGet.resolves(mockResponse)

    let err

    try {
      await util.request(method, url, requestOptions)
    } catch (e) {
      err = e
    }

    expect(err.name).to.equal('LocationSearchError')
    expect(err.message).to.equal('Empty location search response indicated by header check of x-ms-bm-ws-info')
  })
})
