'use strict'

const mocks = {
  createServer: jest.fn(),
  start: jest.fn(),
  exit: jest.fn(),
  flush: jest.fn(),
  fatal: jest.fn()
}

const index = () => {
  let result
  jest.isolateModules(() => {
    jest.doMock('../server', () => mocks.createServer)
    jest.doMock('../server/lib/logging/pino', () => ({
      fatal: mocks.fatal,
      flush: mocks.flush
    }))
    result = require('../index')
  })
  return result
}

describe('Server failure - [server/index.js]', () => {
  let originalExit

  beforeEach(() => {
    originalExit = process.exit
    process.exit = mocks.exit

    mocks.exit.mockImplementation(() => {
      process.exit = originalExit
    })
  })

  afterEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }
    process.exit = originalExit
  })

  it('should handle errors with createServer()', async () => {
    mocks.createServer.mockRejectedValue(new Error('create server went wrong'))
    mocks.fatal.mockReturnValue(undefined)
    mocks.flush.mockImplementation(cb => cb())

    let error
    try {
      await index()
    } catch (e) {
      error = e
    }
    expect(error).toBeUndefined()
    expect(mocks.fatal).toHaveBeenCalledTimes(1)
    expect(mocks.exit).toHaveBeenCalledTimes(1)
    expect(mocks.exit).toHaveBeenLastCalledWith(1)
  })

  it('should handle errors with server.start()', async () => {
    mocks.createServer.mockResolvedValue({ start: mocks.start, listener: {} })
    mocks.start.mockRejectedValue(new Error('server start went wrong'))
    mocks.fatal.mockReturnValue(undefined)
    mocks.flush.mockImplementation(cb => cb())

    let error
    try {
      await index()
    } catch (e) {
      error = e
    }
    expect(error).toBeUndefined()
    expect(mocks.fatal).toHaveBeenCalledTimes(1)
    expect(mocks.exit).toHaveBeenCalledTimes(1)
    expect(mocks.exit).toHaveBeenLastCalledWith(1)
  })

  it('should not fail the server if there is no error', async () => {
    const listener = {}
    mocks.createServer.mockResolvedValue({ start: mocks.start, listener })
    mocks.start.mockResolvedValue(undefined)
    mocks.fatal.mockReturnValue(undefined)
    mocks.flush.mockImplementation(cb => cb())

    let error
    try {
      await index()
    } catch (e) {
      error = e
    }
    expect(error).toBeUndefined()
    expect(mocks.fatal).not.toHaveBeenCalled()
    expect(mocks.exit).not.toHaveBeenCalled()
    expect(listener.requestTimeout).toBe(0)
    expect(listener.headersTimeout).toBe(0)
  })
})
