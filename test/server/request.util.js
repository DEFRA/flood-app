const mocks = {
  wreckGet: jest.fn(),
  wreckPost: jest.fn()
}

describe('Util - Request / outbound request helpers', () => {
  let httpUtils

  beforeAll(() => {
    jest.isolateModules(() => {
      jest.doMock('@hapi/wreck', () => ({
        ...jest.requireActual('@hapi/wreck'),
        defaults: () => ({
          get: mocks.wreckGet,
          post: mocks.wreckPost
        })
      }))
      httpUtils = require('../../server/http-utils')
    })
  })

  afterEach(() => {
    for (const stub of Object.values(mocks)) {
      stub.mockReset()
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
      mocks.wreckGet.mockResolvedValue(mockResponse)
      mocks.wreckPost.mockResolvedValue(mockResponse)

      const [
        getResult,
        postResult
      ] = await Promise.all([
        httpUtils.request('get', getUrl, requestOptions),
        httpUtils.request('post', postUrl, requestOptions)
      ])

      expect(mocks.wreckGet).toHaveBeenCalledTimes(1)
      expect(mocks.wreckGet.mock.calls[0]).toEqual([getUrl, requestOptions])
      expect(getResult).toEqual(mockResponse.payload)

      expect(mocks.wreckPost).toHaveBeenCalledTimes(1)
      expect(mocks.wreckPost.mock.calls[0]).toEqual([postUrl, requestOptions])
      expect(postResult).toEqual(mockResponse.payload)
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
      mocks.wreckGet.mockRejectedValue(requestError)

      let err
      try {
        await httpUtils.request(method, url, requestOptions)
      } catch (e) {
        err = e
      }

      expect(err.message).toBe('some other error')
    })
  })

  describe('get and getJson', () => {
    it('should successfully get data from a URL', async () => {
      const mockPayload = { data: 'test data' }

      mocks.wreckGet.mockResolvedValue({
        res: { statusCode: 200, headers: {} },
        payload: mockPayload
      })

      const result = await httpUtils.get('https://example.com/api', { option: 'value' })

      expect(result).toEqual(mockPayload)
      expect(mocks.wreckGet).toHaveBeenCalledTimes(1)
      expect(mocks.wreckGet.mock.calls[0][0]).toBe('https://example.com/api')
      expect(mocks.wreckGet.mock.calls[0][1]).toEqual({ option: 'value' })
    })

    it('should handle JSON responses with getJson', async () => {
      const mockPayload = { data: 'test data' }

      mocks.wreckGet.mockResolvedValue({
        res: { statusCode: 200, headers: {} },
        payload: mockPayload
      })

      const result = await httpUtils.getJson('https://example.com/api')

      expect(result).toEqual(mockPayload)
      expect(mocks.wreckGet).toHaveBeenCalledTimes(1)
      expect(mocks.wreckGet.mock.calls[0][0]).toBe('https://example.com/api')
      expect(mocks.wreckGet.mock.calls[0][1]).toEqual({ json: true })
    })
  })

  describe('post and postJson', () => {
    it('should post data to a URL', async () => {
      const mockPayload = { ok: true }
      mocks.wreckPost.mockResolvedValue({ res: { statusCode: 200, headers: {} }, payload: mockPayload })

      const result = await httpUtils.post('https://example.com/api', { payload: 'data' })

      expect(result).toEqual(mockPayload)
      expect(mocks.wreckPost).toHaveBeenCalledWith('https://example.com/api', { payload: 'data' })
    })

    it('should post with the json option set', async () => {
      const mockPayload = { ok: true }
      mocks.wreckPost.mockResolvedValue({ res: { statusCode: 200, headers: {} }, payload: mockPayload })

      const result = await httpUtils.postJson('https://example.com/api', { payload: { a: 1 } })

      expect(result).toEqual(mockPayload)
      expect(mocks.wreckPost).toHaveBeenCalledWith('https://example.com/api', { payload: { a: 1 }, json: true })
    })

    it('should default the options when posting json without options', async () => {
      mocks.wreckPost.mockResolvedValue({ res: { statusCode: 200, headers: {} }, payload: {} })

      await httpUtils.postJson('https://example.com/api')

      expect(mocks.wreckPost).toHaveBeenCalledWith('https://example.com/api', { json: true })
    })
  })

  describe('error handling', () => {
    it('should throw error for invalid URLs', async () => {
      const invalidUrl = 'not-a-url'

      await expect(httpUtils.get(invalidUrl)).rejects.toThrow(new Error(`Invalid URL: ${invalidUrl}`))
    })

    it('should throw error object from payload when response status code is not 200', async () => {
      const errorPayload = {
        error: true,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      }

      mocks.wreckGet.mockResolvedValue({
        res: { statusCode: 404, headers: {} },
        payload: errorPayload
      })

      let err
      try {
        await httpUtils.get('https://example.com/api')
      } catch (e) {
        err = e
      }

      expect(err).toEqual(errorPayload)
    })

    it('should throw "Unknown error" when response status code is not 200 with falsy payload', async () => {
      mocks.wreckGet.mockResolvedValue({
        res: { statusCode: 500, headers: {} },
        payload: null
      })

      await expect(httpUtils.get('https://example.com/api')).rejects.toThrow(new Error('Unknown error'))
    })

    it('should throw LocationSearchError when x-ms-bm-ws-info header is 1', async () => {
      mocks.wreckGet.mockResolvedValue({
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

      expect(err.name).toBe('LocationSearchError')
      expect(err.message).toBe('Empty location search response indicated by header check of x-ms-bm-ws-info')
    })

    it('should add method and URL info to request errors', async () => {
      const error = new Error('Response Error: Connection refused')
      mocks.wreckGet.mockRejectedValue(error)

      await expect(httpUtils.get('https://example.com/api?param=value')).rejects.toThrow(new Error('Response Error: Connection refused on GET https://example.com/api'))
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
        mocks.wreckGet.mockReset()
        mocks.wreckGet.mockRejectedValue(new Error('Response Error: Connection refused'))

        await expect(httpUtils.get(testCase.input)).rejects.toThrow(new Error(`Response Error: Connection refused on GET ${testCase.expected}`))
      }
    })
  })
})
