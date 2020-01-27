module.exports = {
  plugin: require('@hapi/good'),
  options: {
    ops: {
      interval: 1000
    },
    reporters: {
      console: [
        {
          module: '@hapi/good-squeeze',
          name: 'Squeeze',
          args: [
            {
              log: 'error',
              error: 'error',
              response: 'error',
              request: 'error'
            }
          ]
        },
        {
          module: '@hapi/good-console'
        },
        'stdout'
      ]
    }
  }
}
