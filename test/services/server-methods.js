'use strict'

describe('Service - Server methods', () => {
  const loadWithLocalCache = localCache => {
    let serverMethods
    jest.isolateModules(() => {
      jest.doMock('../../server/config', () => ({ ...jest.requireActual('../../server/config'), localCache }))
      serverMethods = require('../../server/services/server-methods')
    })
    const server = { method: jest.fn() }
    serverMethods(server)
    return server
  }

  it('should use the default cache when local cache is enabled', () => {
    const server = loadWithLocalCache(true)

    expect(server.method).toHaveBeenCalled()
    server.method.mock.calls
      .filter(([, , options]) => options?.cache)
      .forEach(([, , options]) => expect(options.cache.cache).toBeUndefined())
  })

  it('should use the redis cache when local cache is disabled', () => {
    const server = loadWithLocalCache(false)

    const cached = server.method.mock.calls.filter(([, , options]) => options?.cache)
    expect(cached).not.toBeEmpty()
    cached.forEach(([, , options]) => expect(options.cache.cache).toBe('redis_cache'))
  })

  it('should generate cache keys by joining array arguments', () => {
    const server = loadWithLocalCache(true)

    const keyGenerators = server.method.mock.calls
      .map(([, , options]) => options?.generateKey)
      .filter(Boolean)
    expect(keyGenerators).not.toBeEmpty()
    keyGenerators.forEach(generateKey => expect(generateKey(['a', 'b'])).toBe('a,b'))
  })
})
