module.exports = {
    coverage: true,
    threshold: 60,
    leaks: false,
  
    // lcov reporter required for travisci/codeclimate
    reporter: ['console', 'html', 'lcov'],
    output: ['stdout', 'coverage/coverage.html', 'coverage/lcov.info']
  }
  