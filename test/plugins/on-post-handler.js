'use strict'

const { siteUrl } = require('../../server/config')
const onPostHandler = require('../../server/plugins/on-post-handler')

describe('Plugin - On Post Handler', () => {
  let handler
  const h = { continue: Symbol('continue') }

  const buildRequest = ({ variety = 'view', source = {}, query, referer } = {}) => ({
    path: '/test',
    query,
    headers: { referer },
    state: { set_cookie_usage: 'true', seen_cookie_message: 'true' },
    response: { variety, source }
  })

  beforeEach(() => {
    const server = { ext: jest.fn() }
    onPostHandler.plugin.register(server)
    handler = server.ext.mock.calls[0][1]
  })

  it('should leave non-view responses untouched', () => {
    const request = buildRequest({ variety: 'plain', source: 'payload' })

    expect(handler(request, h)).toBe(h.continue)
    expect(request.response.source).toBe('payload')
  })

  it('should build a context with the full url when none exists', () => {
    const request = buildRequest({ query: { a: '1', b: 'two words' }, referer: `${siteUrl}/previous` })

    expect(handler(request, h)).toBe(h.continue)
    expect(request.response.source.context).toEqual({
      fullUrl: `${siteUrl}/test?a=1&b=two%20words`,
      isDummyData: false,
      fakeBingCall: undefined,
      model: { referer: true }
    })
  })

  it('should add a model with the referer to an existing context without a model', () => {
    const request = buildRequest({ source: { context: {} }, referer: 'https://elsewhere.example' })

    handler(request, h)

    const { context } = request.response.source
    expect(context.fullUrl).toBe(`${siteUrl}/test`)
    expect(context.isDummyData).toBeUndefined()
    expect(context.setCookieUsage).toBe('true')
    expect(context.seenCookieMessage).toBe('true')
    expect(context.model).toEqual({ referer: '' })
  })

  it('should set the referer on an existing context model', () => {
    const request = buildRequest({ source: { context: { model: { isDummyData: true } } } })

    handler(request, h)

    const { context } = request.response.source
    expect(context.isDummyData).toBeTrue()
    expect(context.model).toEqual({ isDummyData: true, referer: '' })
  })
})
