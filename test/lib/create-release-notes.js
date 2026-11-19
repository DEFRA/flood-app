'use strict'

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const testDir = path.join(__dirname, '..', 'test-output')
const fixturesDir = path.join(__dirname, 'data', 'release-notes-fixtures')

// Helper function to execute the create-release-notes script via CLI
async function executeCreateReleaseNotes (argsArray) {
  const scriptPath = path.join(__dirname, '..', '..', 'release-docs', 'lib', 'create-release-notes.js')

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath, ...argsArray])
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        success: code === 0
      })
    })
  })
}

// Helper function to test the main function directly with mocked argv
function testMainFunction (args) {
  const originalArgv = process.argv
  try {
    process.argv = ['node', 'create-release-notes.js', ...args]
    // Clear the require cache to get fresh instance
    delete require.cache[require.resolve('../../release-docs/lib/create-release-notes.js')]
    const { main } = require('../../release-docs/lib/create-release-notes.js')
    return main()
  } finally {
    process.argv = originalArgv
    // Clear cache again for next test
    delete require.cache[require.resolve('../../release-docs/lib/create-release-notes.js')]
  }
}

describe('create-release-notes.js', () => {
  beforeAll(() => {
    // Create test output directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }

    // Create fixtures directory if it doesn't exist
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true })
    }

    // Create test template file
    const testTemplate = `# Release {{ version }}
Date: {{ date }}
ID: {{ id }}
{% if dbChanges %}Database changes included{% endif %}
Tickets:
{% for ticket in tickets %}
- {{ ticket }}
{% endfor %}`

    fs.writeFileSync(path.join(fixturesDir, 'test-template.njk'), testTemplate)

    // Create test commit list with various formats
    const testCommits = `FSR-123 Fix flood warning display
FSR-456 Update station data

FSR-789 Add new feature
`
    fs.writeFileSync(path.join(fixturesDir, 'test-commits.txt'), testCommits)

    // Create empty commit list
    fs.writeFileSync(path.join(fixturesDir, 'empty-commits.txt'), '')

    // Create commit list with only whitespace
    fs.writeFileSync(path.join(fixturesDir, 'whitespace-commits.txt'), '   \n\n   \n')
  })

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true })
    }
  })

  it('should generate release notes with all required parameters', async () => {
    const outputFile = path.join(testDir, 'release-notes-1.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeTrue()

    // Check that output file was created
    expect(fs.existsSync(outputFile)).toBeTrue()

    // Check output content
    const output = fs.readFileSync(outputFile, 'utf8')
    expect(output).toContain('Release 8.26.0')
    expect(output).toContain('Date: 2024-03-15')
    expect(output).toContain('ID: 12345')
    expect(output).toContain('- FSR-123 Fix flood warning display')
    expect(output).toContain('- FSR-456 Update station data')
    expect(output).toContain('- FSR-789 Add new feature')
  })

  it('should include database changes text when dbChanges flag is set', async () => {
    const outputFile = path.join(testDir, 'release-notes-2.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk'),
      '--dbChanges'
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeTrue()

    const output = fs.readFileSync(outputFile, 'utf8')
    expect(output).toContain('Database changes included')
  })

  it('should not include database changes text when dbChanges flag is not set', async () => {
    const outputFile = path.join(testDir, 'release-notes-3.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeTrue()

    const output = fs.readFileSync(outputFile, 'utf8')
    expect(output).not.toContain('Database changes included')
  })

  it('should filter out empty lines from commit list', async () => {
    const outputFile = path.join(testDir, 'release-notes-4.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeTrue()

    const output = fs.readFileSync(outputFile, 'utf8')
    const lines = output.split('\n').filter(line => line.trim().startsWith('-'))
    expect(lines).toHaveLength(3) // Only 3 actual tickets, not 4 (empty line filtered)
  })

  it('should handle empty commit list', async () => {
    const outputFile = path.join(testDir, 'release-notes-5.md')
    const args = [
      '-f', path.join(fixturesDir, 'empty-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeTrue()

    const output = fs.readFileSync(outputFile, 'utf8')
    expect(output).toContain('Release 8.26.0')
    // Should not contain any ticket items
    const lines = output.split('\n').filter(line => line.trim().startsWith('-'))
    expect(lines).toHaveLength(0)
  })

  it('should handle commit list with only whitespace', async () => {
    const outputFile = path.join(testDir, 'release-notes-6.md')
    const args = [
      '-f', path.join(fixturesDir, 'whitespace-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeTrue()

    const output = fs.readFileSync(outputFile, 'utf8')
    const lines = output.split('\n').filter(line => line.trim().startsWith('-'))
    expect(lines).toHaveLength(0) // All whitespace lines should be filtered
  })

  it('should use short aliases for parameters', async () => {
    const outputFile = path.join(testDir, 'release-notes-7.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk'),
      '-c' // short form of dbChanges
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeTrue()

    const output = fs.readFileSync(outputFile, 'utf8')
    expect(output).toContain('Database changes included')
  })

  it('should fail when required file parameter is missing', async () => {
    const outputFile = path.join(testDir, 'release-notes-8.md')
    const args = [
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeFalse()
    expect(result.stderr).toContain('file')
  })

  it('should fail when required output parameter is missing', async () => {
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeFalse()
    expect(result.stderr).toContain('output')
  })

  it('should fail when required date parameter is missing', async () => {
    const outputFile = path.join(testDir, 'release-notes-9.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-r', '8.26.0',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeFalse()
    expect(result.stderr).toContain('date')
  })

  it('should fail when required release parameter is missing', async () => {
    const outputFile = path.join(testDir, 'release-notes-10.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-i', '12345',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeFalse()
    expect(result.stderr).toContain('release')
  })

  it('should fail when required id parameter is missing', async () => {
    const outputFile = path.join(testDir, 'release-notes-11.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-t', path.join(fixturesDir, 'test-template.njk')
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeFalse()
    expect(result.stderr).toContain('id')
  })

  it('should fail when required template parameter is missing', async () => {
    const outputFile = path.join(testDir, 'release-notes-12.md')
    const args = [
      '-f', path.join(fixturesDir, 'test-commits.txt'),
      '-o', outputFile,
      '-d', '2024-03-15',
      '-r', '8.26.0',
      '-i', '12345'
    ]

    const result = await executeCreateReleaseNotes(args)
    expect(result.success).toBeFalse()
    expect(result.stderr).toContain('template')
  })

  it('should display help with --help flag', async () => {
    const result = await executeCreateReleaseNotes(['--help'])

    // In yargs v18, help is output to stdout, not stderr
    const output = result.stdout || result.stderr
    expect(output).toContain('--file')
    expect(output).toContain('--output')
    expect(output).toContain('--date')
    expect(output).toContain('--release')
    expect(output).toContain('--id')
    expect(output).toContain('--template')
    expect(output).toContain('--dbChanges')
  })

  // Direct function tests using require and process.argv mocking (for coverage)
  describe('main function (coverage tests)', () => {
    it('should generate release notes when called directly', () => {
      const outputFile = path.join(testDir, 'direct-test-1.md')
      const result = testMainFunction([
        '-f', path.join(fixturesDir, 'test-commits.txt'),
        '-o', outputFile,
        '-d', '2024-03-15',
        '-r', '8.26.0',
        '-i', '12345',
        '-t', path.join(fixturesDir, 'test-template.njk')
      ])

      expect(fs.existsSync(outputFile)).toBeTrue()
      expect(result).toContain('Release 8.26.0')
      expect(result).toContain('Date: 2024-03-15')
    })

    it('should include database changes when flag is set', () => {
      const outputFile = path.join(testDir, 'direct-test-2.md')
      const result = testMainFunction([
        '-f', path.join(fixturesDir, 'test-commits.txt'),
        '-o', outputFile,
        '-d', '2024-03-15',
        '-r', '8.26.0',
        '-i', '12345',
        '-t', path.join(fixturesDir, 'test-template.njk'),
        '--dbChanges'
      ])

      expect(result).toContain('Database changes included')
    })

    it('should filter empty lines and process tickets correctly', () => {
      const outputFile = path.join(testDir, 'direct-test-3.md')
      const result = testMainFunction([
        '-f', path.join(fixturesDir, 'test-commits.txt'),
        '-o', outputFile,
        '-d', '2024-03-15',
        '-r', '8.26.0',
        '-i', '12345',
        '-t', path.join(fixturesDir, 'test-template.njk')
      ])

      expect(result).toContain('- FSR-123')
      expect(result).toContain('- FSR-456')
      expect(result).toContain('- FSR-789')
    })

    it('should handle empty commit list', () => {
      const outputFile = path.join(testDir, 'direct-test-4.md')
      const result = testMainFunction([
        '-f', path.join(fixturesDir, 'empty-commits.txt'),
        '-o', outputFile,
        '-d', '2024-03-15',
        '-r', '8.26.0',
        '-i', '12345',
        '-t', path.join(fixturesDir, 'test-template.njk')
      ])

      expect(result).toContain('Release 8.26.0')
      const ticketLines = result.split('\n').filter(line => line.trim().startsWith('-'))
      expect(ticketLines).toHaveLength(0)
    })
  })
})
