const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const lab = exports.lab = Lab.script()
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const mocks = {
  wreckGet: sinon.stub(),
  wreckPost: sinon.stub()
}

lab.experiment('http-utils / outbound request helpers', () => {
  let httpUtils
  lab.before(() => {
    httpUtils = proxyquire('../../server/http-utils', {
      '@hapi/wreck': {
        defaults: () => ({
          get: mocks.wreckGet,
          post: mocks.wreckPost
        })
      }
    })
  })
  lab.afterEach(() => {
    for (const stub of Object.values(mocks)) {
      stub.reset()
    }
  })

  lab.experiment('request', () => {
    lab.test('uses acts as a proxy for the relevant wreck method', async () => {
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

    lab.test('does not add the method and url to non-request errors', async () => {
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

  lab.experiment('get and getJson', () => {
    lab.test('should successfully get data from a URL', async () => {
      // Mock successful response
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

    lab.test('should handle JSON responses with getJson', async () => {
      // Mock successful JSON response
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

  lab.experiment('error handling', () => {
    lab.test('should throw error for invalid URLs', async () => {
      // Test with a single invalid URL
      const invalidUrl = 'not-a-url'

      await expect(httpUtils.get(invalidUrl)).to.reject(`Invalid URL: ${invalidUrl}`)
    })

    lab.test('should throw error object from payload when response status code is not 200', async () => {
      // Mock error response with JSON error object (typical API error response)
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

      // The error thrown should be the payload object itself
      expect(err).to.equal(errorPayload)
    })

    lab.test('should throw "Unknown error" when response status code is not 200 with falsy payload', async () => {
      // Mock error response with null payload
      mocks.wreckGet.resolves({
        res: { statusCode: 500, headers: {} },
        payload: null
      })

      // Should throw the default "Unknown error"
      await expect(httpUtils.get('https://example.com/api')).to.reject('Unknown error')
    })

    lab.test('should throw LocationSearchError when x-ms-bm-ws-info header is 1', async () => {
      // Mock response with special header
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

    lab.test('should add method and URL info to request errors', async () => {
      // Mock network error
      const error = new Error('Response Error: Connection refused')
      mocks.wreckGet.rejects(error)

      await expect(httpUtils.get('https://example.com/api?param=value')).to.reject('Response Error: Connection refused on GET https://example.com/api')
    })

    lab.test('should remove query parameters from URL in error messages', async () => {
      // Test with various URL formats
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
        // Reset the stub for each test case
        mocks.wreckGet.reset()
        mocks.wreckGet.rejects(new Error('Response Error: Connection refused'))

        await expect(httpUtils.get(testCase.input)).to.reject(`Response Error: Connection refused on GET ${testCase.expected}`)
      }
    })
  })
})
