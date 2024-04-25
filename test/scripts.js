'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()

async function executeNpmScript (scriptName) {
  const util = require('util')
  const exec = util.promisify(require('child_process').exec)
  try {
    const { stdout, stderr } = await exec(`npm run ${scriptName}`)
    return { stdout, stderr }
  } catch (error) {
    return { stdout: '', stderr: error.stderr }
  }
}
describe('scripts', () => {
  it('should run npm create-release-notes successfully', async () => {
    // this test is to check that all the necessary modules are installed following the accidental
    // removal of nunjucks and yargs which wasn't picked up until the create release github action
    // was run
    const { stdout, stderr } = await executeNpmScript('create-release-notes -- --help')

    expect(stderr).to.be.empty()
    expect(stdout).to.contain('node release-docs/lib/create-release-notes.js --help')
  })
})
