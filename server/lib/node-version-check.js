const semver = require('semver')

function nodeVersionCheck (requiredVersion) {
  if (requiredVersion && !semver.satisfies(process.version, requiredVersion)) {
    throw new Error(`Node.js version ${process.version} does not satisfy the required version ${requiredVersion}`)
  }
}

module.exports = nodeVersionCheck
