'use strict'
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script()
const { stub } = require('sinon')
const proxyquire = require('proxyquire')
const { once } = require('node:events')

const stubs = {
  Notifier: stub(),
  addFilter: stub(),
  notify: stub(),
  flush: stub()
}

const errbitTransport = proxyquire('../../../server/lib/logging/errbit-transport', {
  '@airbrake/node': { Notifier: stubs.Notifier }
})

experiment('errbit transport', () => {
  beforeEach(() => {
    stubs.Notifier.callsFake(() => ({
      notify: stubs.notify,
      addFilter: stubs.addFilter,
      flush: stubs.flush
    }))
    stubs.flush.callsFake(() => Promise.resolve())
  })
  afterEach(() => {
    for (const stub of Object.values(stubs)) {
      stub.reset()
    }
  })

  test('it skips creating an errbit connection if errbit is disabled', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: false,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    stream.write(JSON.stringify({
      logLevel: 'error',
      err: {
        name: 'some-name',
        message: 'some-message',
        stack: 'some-stack',
        code: 1234
      }
    }))
    stream.end()
    await once(stream, 'close')

    expect(stubs.Notifier.callCount).to.equal(0)
    expect(stubs.notify.callCount).to.equal(0)
  })

  test('a filter is added which adds the severity, environment and version to each notice', () => {
    errbitTransport({
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })
    const filter = stubs.addFilter.lastCall.args[0]

    const filtered = filter({
      error: 'some-error',
      context: {},
      params: {
        some: 'param'
      }
    })

    expect(filtered).to.equal({
      error: 'some-error',
      context: {
        severity: 'comical',
        environment: 'unit-test',
        version: '0.0.0'
      },
      params: {
        some: 'param'
      }
    })
  })

  test('log lines without an err key are ignored', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    stream.write(JSON.stringify({
      logLevel: 'error',
      message: 'boom'
    }))
    stream.end()
    await once(stream, 'close')

    expect(stubs.notify.callCount).to.equal(0)
  })

  test('log lines with req/res information have it added to the errbit notice', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    stream.write(JSON.stringify({
      logLevel: 'error',
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
    }))
    stream.end()
    await once(stream, 'close')

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

  test('the airbrake connection is flushed when the stream is closed', async () => {
    const stream = errbitTransport({
      severity: 'comical',
      enabled: true,
      host: 'some-host',
      projectId: 'some-project-id',
      projectKey: 'some-project-key',
      environment: 'unit-test',
      version: '0.0.0'
    })

    stream.end()
    await once(stream, 'close')

    expect(stubs.flush.callCount).to.equal(1)
  })
})
