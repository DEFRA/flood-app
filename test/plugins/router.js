'use strict'

describe('Plugin - Router', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  const getRegisteredPaths = env => {
    process.env = { ...originalEnv, ...env }
    let router
    jest.isolateModules(() => {
      router = require('../../server/plugins/router')
    })
    const server = { route: jest.fn() }
    router.plugin.register(server)
    return server.route.mock.calls[0][0].map(route => route.path)
  }

  it('should register the status and webchat routes in non production environments with webchat enabled', () => {
    const paths = getRegisteredPaths({ NODE_ENV: 'test', WEBCHAT_ENABLED: 'true' })

    expect(paths).toContain('/')
    expect(paths).toContain('/status')
    expect(paths).toContain('/api/webchat/availability')
  })

  it('should not register the status or webchat routes in production with webchat disabled', () => {
    const paths = getRegisteredPaths({ NODE_ENV: 'production', WEBCHAT_ENABLED: 'false' })

    expect(paths).toContain('/')
    expect(paths).not.toContain('/status')
    expect(paths).not.toContain('/api/webchat/availability')
  })
})
