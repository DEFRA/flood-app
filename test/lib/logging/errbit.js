'use strict'
const { once } = require('node:events')

describe('Logging - Errbit', () => {
  let Errbit
  let notify
  let flush
  let addFilter

  beforeEach(() => {
    jest.resetModules()
    notify = jest.fn().mockResolvedValue()
    flush = jest.fn().mockResolvedValue()
    addFilter = jest.fn()

    jest.doMock('@airbrake/node', () => ({
      Notifier: jest.fn().mockImplementation(() => ({
        notify,
        addFilter,
        flush
      }))
    }))

    Errbit = require('../../../server/lib/logging/errbit')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()
  })

  it('should not send notices to airbrake when enable is false', async () => {
    const options = {
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    }

    const errbit = new Errbit(options)

    await errbit.send({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    })

    expect(notify).not.toHaveBeenCalled()
  })

  it('should send notices to airbrake when enable is true', async () => {
    const options = {
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    }

    const errbit = new Errbit(options)

    await errbit.send({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    })

    expect(notify).toHaveBeenCalledTimes(1)
  })

  it('should remain unflushed (airbrake) when enable is false and close is called', async () => {
    const options = {
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    }

    const errbit = new Errbit(options)

    await errbit.close()

    expect(flush).not.toHaveBeenCalled()
  })

  it('should be flushed (airbrake) when enable is true and close is called', async () => {
    const options = {
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    }

    const errbit = new Errbit(options)

    await errbit.close()

    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('should format the error when incoming data contains an err key', async () => {
    const options = {
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    }

    const errbit = new Errbit(options)

    await errbit.send({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    })

    expect(notify.mock.calls[0][0].error).toEqual({
      name: 'some-name',
      message: 'some-message',
      stack: 'some-stack',
      code: 1234
    })
  })

  it('should be added to the sent notice when incoming data contains req/res information', async () => {
    const options = {
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    }

    const errbit = new Errbit(options)

    await errbit.send({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      },
      req: {
        url: '/some/path',
        method: 'GET',
        query: {
          a: 1
        }
      },
      res: {
        statusCode: 418
      }
    })

    expect(notify.mock.calls[0][0].context.httpMethod).toBe('GET')
    expect(notify.mock.calls[0][0].context.route).toBe('/some/path')
    expect(notify.mock.calls[0][0].params).toEqual({
      request: {
        url: '/some/path',
        method: 'GET',
        query: {
          a: 1
        }
      },
      response: {
        statusCode: 418
      }
    })
  })

  it('should add environment, version and severity to notices', async () => {
    const options = {
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    }

    const errbit = new Errbit(options)

    await errbit.send({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    })

    expect(notify.mock.calls[0][0].context.version).toBe('0.0.0')
    expect(notify.mock.calls[0][0].context.environment).toBe('unit-test')
    expect(notify.mock.calls[0][0].context.severity).toBe('comical')
  })
})

describe('Logging - Errbit Transport', () => {
  let errbitTransport
  let send
  let close
  let consoleError

  beforeEach(() => {
    jest.resetModules()
    send = jest.fn()
    close = jest.fn()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    jest.doMock('../../../server/lib/logging/errbit', () => {
      return jest.fn().mockImplementation(() => ({
        send,
        close
      }))
    })

    errbitTransport = require('../../../server/lib/logging/errbit-transport')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()
  })

  it('should send messages containing an err', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    send.mockResolvedValue()
    close.mockResolvedValue()

    stream.write(JSON.stringify({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    }))

    stream.end()

    await once(stream, 'close')

    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toEqual({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    })
  })

  it('should not send messages on sending failures', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    send.mockRejectedValue(new Error('not sent'))
    close.mockResolvedValue()

    let err

    stream.on('error', (error) => {
      err = error
    })

    stream.write(JSON.stringify({
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    }))

    stream.end()

    await once(stream, 'close')

    expect(err).toBeUndefined()
    expect(consoleError.mock.calls[0][0]).toEqual(new Error('not sent'))
  })

  it('should skip messages not containing an err key', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    send.mockResolvedValue()
    close.mockResolvedValue()

    stream.write(JSON.stringify({
      message: 'Hello Worlds'
    }))

    stream.end()

    await once(stream, 'close')

    expect(send).not.toHaveBeenCalled()
  })

  it('should close successfully when errbit is closed', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    close.mockResolvedValue()

    stream.end()
    await once(stream, 'close')

    expect(close).toHaveBeenCalledTimes(1)
  })

  it('should error on errbit close failure', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    close.mockRejectedValue(new Error('bang!'))

    let err

    stream.on('error', (error) => {
      err = error
    })

    stream.end()

    await once(stream, 'close')

    expect(err).toBeUndefined()
    expect(consoleError.mock.calls[0][0]).toEqual(new Error('bang!'))
  })
})
