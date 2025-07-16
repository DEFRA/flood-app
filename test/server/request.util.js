const proxyquire = require('proxyquire')
const sinon = require('sinon')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')

const { describe, it, before, afterEach } = exports.lab = Lab.script()

const mocks = {
  wreckGet: sinon.stub(),
  wreckPost: sinon.stub()
}

describe('Util - Request / outbound request helpers', () => {
  let httpUtils

  before(() => {
    httpUtils = proxyquire('../../server/http-utils', {
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

  describe('request', () => {
    it('should act as a proxy for the relevant wreck method', async () => {
      const getUrl = 'http://example.com/some/get/url'
      const postUrl = 'http://example.com/some/post/url'
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
        httpUtils.request('get', getUrl, requestOptions),
        httpUtils.request('post', postUrl, requestOptions)
      ])

      expect(mocks.wreckGet.callCount).to.equal(1)
      expect(mocks.wreckGet.firstCall.args).to.equal([getUrl, requestOptions])
      expect(getResult).to.equal(mockResponse.payload)

      expect(mocks.wreckPost.callCount).to.equal(1)
      expect(mocks.wreckPost.firstCall.args).to.equal([postUrl, requestOptions])
      expect(postResult).to.equal(mockResponse.payload)
    })

    it('should not add the method and url to non-request errors', async () => {
      const method = 'get'
      const url = 'http://example.com/some/get/url'
      const requestOptions = {
        headers: {
          'some-header': 'some-value'
        }
      }
      const requestError = new Error('some other error')
      mocks.wreckGet.rejects(requestError)

      let err
      try {
        await httpUtils.request(method, url, requestOptions)
      } catch (e) {
        err = e
      }

      expect(err.message).to.equal('some other error')
    })
  })

  describe('get and getJson', () => {
    it('should successfully get data from a URL', async () => {
      const mockPayload = { data: 'test data' }

      mocks.wreckGet.resolves({
        res: { statusCode: 200, headers: {} },
        payload: mockPayload
      })

      const result = await httpUtils.get('https://example.com/api', { option: 'value' })

      expect(result).to.equal(mockPayload)
      expect(mocks.wreckGet.calledOnce).to.be.true()
      expect(mocks.wreckGet.firstCall.args[0]).to.equal('https://example.com/api')
      expect(mocks.wreckGet.firstCall.args[1]).to.equal({ option: 'value' })
    })

    it('should handle JSON responses with getJson', async () => {
      const mockPayload = { data: 'test data' }

      mocks.wreckGet.resolves({
        res: { statusCode: 200, headers: {} },
        payload: mockPayload
      })

      const result = await httpUtils.getJson('https://example.com/api')

      expect(result).to.equal(mockPayload)
      expect(mocks.wreckGet.calledOnce).to.be.true()
      expect(mocks.wreckGet.firstCall.args[0]).to.equal('https://example.com/api')
      expect(mocks.wreckGet.firstCall.args[1]).to.equal({ json: true })
    })
  })

  describe('error handling', () => {
    it('should throw error for invalid URLs', async () => {
      const invalidUrl = 'not-a-url'

      await expect(httpUtils.get(invalidUrl)).to.reject(`Invalid URL: ${invalidUrl}`)
    })

    it('should throw error object from payload when response status code is not 200', async () => {
      const errorPayload = {
        error: true,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      }

      mocks.wreckGet.resolves({
        res: { statusCode: 404, headers: {} },
        payload: errorPayload
      })

      let err
      try {
        await httpUtils.get('https://example.com/api')
      } catch (e) {
        err = e
      }

      expect(err).to.equal(errorPayload)
    })

    it('should throw "Unknown error" when response status code is not 200 with falsy payload', async () => {
      mocks.wreckGet.resolves({
        res: { statusCode: 500, headers: {} },
        payload: null
      })

      await expect(httpUtils.get('https://example.com/api')).to.reject('Unknown error')
    })

    it('should throw LocationSearchError when x-ms-bm-ws-info header is 1', async () => {
      mocks.wreckGet.resolves({
        res: {
          statusCode: 200,
          headers: { 'x-ms-bm-ws-info': '1' }
        },
        payload: {}
      })

      let err
      try {
        await httpUtils.request('get', 'http://example.com/some/get/url', {})
      } catch (e) {
        err = e
      }

      expect(err.name).to.equal('LocationSearchError')
      expect(err.message).to.equal('Empty location search response indicated by header check of x-ms-bm-ws-info')
    })

    it('should add method and URL info to request errors', async () => {
      const error = new Error('Response Error: Connection refused')
      mocks.wreckGet.rejects(error)

      await expect(httpUtils.get('https://example.com/api?param=value')).to.reject('Response Error: Connection refused on GET https://example.com/api')
    })

    it('should remove query parameters from URL in error messages', async () => {
      const testUrls = [
        {
          input: 'https://example.com/api?param=value&another=123',
          expected: 'https://example.com/api'
        },
        {
          input: 'https://example.com/api?param=special&chars=a+b%20c',
          expected: 'https://example.com/api'
        },
        {
          input: 'https://example.com/api?multiline=value\nwith\nnewlines',
          expected: 'https://example.com/api'
        }
      ]

      for (const testCase of testUrls) {
        mocks.wreckGet.reset()
        mocks.wreckGet.rejects(new Error('Response Error: Connection refused'))

        await expect(httpUtils.get(testCase.input)).to.reject(`Response Error: Connection refused on GET ${testCase.expected}`)
      }
    })
  })
})
