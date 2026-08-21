'use strict'

module.exports = [
  ...require('neostandard')({ ignores: ['server/dist/**', '**/service-down/**'] }),
  // @hapi/lab's coverage instrumentation parses files with @babel/eslint-parser using
  // this calculated config; without requireConfigFile: false it demands a babel.config file
  {
    languageOptions: {
      parserOptions: {
        requireConfigFile: false
      }
    }
  }
]
