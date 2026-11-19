'use strict'

// The real logger starts a pino transport worker thread (and Errbit target) every
// time it is loaded. Jest gives each test file its own module registry, so that
// leaks process listeners and runs real log transports during unit tests.
jest.mock('../../../server/lib/logging/pino', () => require('pino')({ level: 'silent' }, { write: () => {} }))
