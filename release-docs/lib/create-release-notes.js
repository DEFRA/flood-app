const fs = require('fs')
const nunjucks = require('nunjucks')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

function formatReleaseDate (date) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date)
  if (!match) {
    return date
  }

  const [, day, month, year] = match
  const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (parsedDate.getUTCDate() !== Number(day) ||
      parsedDate.getUTCMonth() !== Number(month) - 1 ||
      parsedDate.getUTCFullYear() !== Number(year)) {
    throw new Error(`Invalid release date: ${date}`)
  }

  const dayNumber = Number(day)
  const ordinal = dayNumber % 100 >= 11 && dayNumber % 100 <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[dayNumber % 10] || 'th')
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const weekday = weekdays[parsedDate.getUTCDay()]
  const monthName = months[parsedDate.getUTCMonth()]

  return `${weekday} ${dayNumber}${ordinal} ${monthName} ${year}`
}

function main () {
  const options = yargs(hideBin(process.argv))
    .option('f', {
      alias: 'file',
      describe: 'Input file path',
      demandOption: true,
      type: 'string'
    })
    .option('o', {
      alias: 'output',
      describe: 'Output file',
      demandOption: true,
      type: 'string'
    })
    .option('d', {
      alias: 'date',
      describe: 'Release date',
      demandOption: true,
      type: 'string'
    })
    .option('r', {
      alias: 'release',
      describe: 'Release version',
      demandOption: true,
      type: 'string'
    })
    .option('i', {
      alias: 'id',
      describe: 'Jira Release id',
      demandOption: true,
      type: 'string'
    })
    .option('t', {
      alias: 'template',
      describe: 'Template file',
      demandOption: true,
      type: 'string'
    })
    .option('c', {
      alias: 'dbChanges',
      describe: 'Include database changes',
      type: 'boolean',
      default: false
    })
    .argv

  const templateStr = fs.readFileSync(options.template, 'utf8')
  const commitList = fs.readFileSync(options.file, 'utf8')
  const tickets = commitList.split('\n').filter(c => c.trim() !== '')

  const context = {
    version: options.release,
    date: formatReleaseDate(options.date),
    id: options.id,
    dbChanges: options.dbChanges,
    tickets
  }

  const outputStr = nunjucks.renderString(templateStr, context)

  fs.writeFileSync(options.output, outputStr)

  return outputStr
}

// Excluded from coverage as this IS tested but not detected as covered
/* $lab:coverage:off$ */
if (require.main === module) {
  main()
}
/* $lab:coverage:on$ */

module.exports = { main, formatReleaseDate }
