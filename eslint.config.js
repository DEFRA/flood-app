const globals = require('globals')

module.exports = [
  ...require('neostandard')({}),
  {
    languageOptions: {
      parserOptions: {
        // required by @hapi/lab's coverage instrumentation (@babel/eslint-parser)
        requireConfigFile: false
      }
    }
  },
  {
    files: ['server/src/javascripts/**/*.js'],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    ignores: [
      'server/dist/**',
      'service-down/**'
    ]
  }
]
