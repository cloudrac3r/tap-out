const trim = require('trim')
const { isFailAssertionLine, isErrorOutputStart, isErrorOutputEnd, splitFirst } = require('./fns')

const handleError = function (line) {
  let lastAssert

  // Start of error output
  if (isErrorOutputStart(line)) {
    this.writingErrorOutput = true
    this.lastAsserRawErrorString = ''
  }
  // End of error output
  else if (isErrorOutputEnd(line)) {
    this.writingErrorOutput = false
    this.currentNextLineError = null
    this.writingErrorStackOutput = false

    // Emit error here so it has the full error message with it
    let lastOne = this.results.fail[this.results.fail.length - 1]

    if (this.tmpErrorOutput) {
      lastOne.error.stack = this.tmpErrorOutput
      this.lastAsserRawErrorString += this.tmpErrorOutput + '\n'
      this.tmpErrorOutput = ''
    }

    // right-trimmed raw error string
    lastOne.error.raw = this.lastAsserRawErrorString.replace(/\s+$/g, '')

    this.emit('fail', lastOne)
  }
  // Append to stack
  else if (this.writingErrorStackOutput) {
    this.tmpErrorOutput += trim(line) + '\n'
  }
  // Not the beginning of the error message but it's the body
  else if (this.writingErrorOutput) {
    let m = splitFirst(trim(line), ':')
    lastAssert = this.results.fail[this.results.fail.length - 1]

    // Rebuild raw error output
    this.lastAsserRawErrorString += line + '\n'

    if (m[0] === 'stack') {
      this.writingErrorStackOutput = true
      return
    }

    let msg = trim((m[1] || '').replace(/['"]+/g, ''))

    if (m[0] === 'at') {
      // Example string: Object.async.eachSeries (/Users/scott/www/modules/nash/node_modules/async/lib/async.js:145:20)

      msg = msg.split(' ')[1] || ''
      msg = msg.replace('(', '').replace(')', '')

      let values = msg.split(':')
      let file = values.slice(0, values.length - 2).join(':')

      msg = {
        file: file,
        line: values[values.length - 2],
        character: values[values.length - 1],
      }
    }

    // This is a plan failure
    if (lastAssert.name === 'plan != count') {
      lastAssert.type = 'plan'
      delete lastAssert.error.at
      lastAssert.error.operator = 'count'

      // Need to set this value
      if (m[0] === 'actual') {
        lastAssert.error.actual = trim(m[1])
      }
    }

    // outputting expected/actual object or array
    if (this.currentNextLineError) {
      lastAssert.error[this.currentNextLineError] = trim(line)
      this.currentNextLineError = null
    } else if (trim(m[1]) === '|-') {
      this.currentNextLineError = m[0]
    } else {
      lastAssert.error[m[0]] = msg
    }
  }
  // Emit fail when error on previous line had no diagnostics
  else if (this.previousLine && isFailAssertionLine(this.previousLine)) {
    lastAssert = this.results.fail[this.results.fail.length - 1]

    this.emit('fail', lastAssert)
  }
}
module.exports = handleError
