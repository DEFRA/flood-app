describe('Config - [server/config.js]', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  const loadConfig = env => {
    process.env = { ...originalEnv, ...env }
    let config
    jest.isolateModules(() => {
      config = require('../server/config')
    })
    return config
  }

  it('should load the config file', () => {
    expect(() => {
      require('../server/config')
    }).not.toThrow()
  })

  it('should default the rate limit whitelist to an empty array', () => {
    const config = loadConfig({ FLOOD_APP_RATE_LIMIT_WHITELIST: '' })

    expect(config.rateLimitWhitelist).toEqual([])
  })

  it('should split the rate limit whitelist on colons', () => {
    const config = loadConfig({ FLOOD_APP_RATE_LIMIT_WHITELIST: '1.1.1.1:2.2.2.2' })

    expect(config.rateLimitWhitelist).toEqual(['1.1.1.1', '2.2.2.2'])
  })

  it('should throw if the config is invalid', () => {
    expect(() => loadConfig({ PORT: 'not-a-port' })).toThrow(/^The server config is invalid\./)
  })
})
