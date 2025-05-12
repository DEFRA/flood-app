'use strict'
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach, after } = exports.lab = Lab.script()
const { stub } = require('sinon')
const proxyquire = require('proxyquire')
const { once } = require('node:events')

const stubs = {
  Errbit: stub(),
  send: stub(),
  close: stub(),
  consoleError: stub(console, 'error'),
  Notifier: stub(),
  notify: stub(),
  flush: stub()
}

const Errbit = proxyquire('../../../server/lib/logging/errbit', {
  '@airbrake/node': { Notifier: stubs.Notifier }
})

const errbitTransport = proxyquire('../../../server/lib/logging/errbit-transport', {
  './errbit': stubs.Errbit
})

describe('Logging - Errbit', () => {
  beforeEach(() => {
    stubs.Notifier.callsFake(() => ({
      notify: stubs.notify,
      addFilter: stubs.addFilter,
      flush: stubs.flush
    }))

    stubs.flush.callsFake(() => Promise.resolve())
    stubs.notify.callsFake(() => Promise.resolve())
  })

  afterEach(() => {
    for (const stub of Object.values(stubs)) {
      stub.reset()
    }
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

    expect(stubs.notify.called).to.equal(false)
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

    expect(stubs.notify.called).to.equal(true)
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

    expect(stubs.flush.called).to.equal(false)
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

    expect(stubs.flush.called).to.equal(true)
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

    expect(stubs.notify.lastCall.args[0].error).to.equal({
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

    expect(stubs.notify.lastCall.args[0].context.httpMethod).to.equal('GET')
    expect(stubs.notify.lastCall.args[0].context.route).to.equal('/some/path')
    expect(stubs.notify.lastCall.args[0].params).to.equal({
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

    expect(stubs.notify.lastCall.args[0].context.version).to.equal('0.0.0')
    expect(stubs.notify.lastCall.args[0].context.environment).to.equal('unit-test')
    expect(stubs.notify.lastCall.args[0].context.severity).to.equal('comical')
  })
})

describe('Logging - Errbit Transport', () => {
  beforeEach(() => {
    stubs.Errbit.callsFake(() => ({
      send: stubs.send,
      close: stubs.close
    }))
  })

  afterEach(() => {
    for (const stub of Object.values(stubs)) {
      stub.reset()
    }
  })

  after(() => {
    for (const stub of Object.values(stubs)) {
      if (stub.restore) {
        stub.restore()
      }
    }
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

    stubs.send.resolves()
    stubs.close.resolves()

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

    expect(stubs.send.callCount).to.equal(1)

    expect(stubs.send.lastCall.args[0]).to.equal({
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

    stubs.send.rejects(new Error('not sent'))
    stubs.close.resolves()

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

    expect(err).to.equal(undefined)
    expect(stubs.consoleError.lastCall.args[0]).to.equal(new Error('not sent'))
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

    stubs.send.resolves()
    stubs.close.resolves()

    stream.write(JSON.stringify({
      message: 'Hello Worlds'
    }))

    stream.end()

    await once(stream, 'close')

    expect(stubs.send.callCount).to.equal(0)
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

    stubs.close.resolves()

    stream.end()
    await once(stream, 'close')

    expect(stubs.close.callCount).to.equal(1)
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

    stubs.close.rejects(new Error('bang!'))

    let err

    stream.on('error', (error) => {
      err = error
    })

    stream.end()

    await once(stream, 'close')

    expect(err).to.equal(undefined)
    expect(stubs.consoleError.lastCall.args[0]).to.equal(new Error('bang!'))
  })
})
