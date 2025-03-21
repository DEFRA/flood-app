const semver = require('semver')

function nodeVersionCheck (requiredVersion) {
  if (requiredVersion && !semver.satisfies(process.version, requiredVersion)) {
    // note - use console.error here rather than pino as this check will be run
    // before configuration is done
    console.error(`Error: Node.js version ${process.version} does not satisfy the required version ${requiredVersion}`)
    process.exit(1)
  }
}

module.exports = nodeVersionCheck
