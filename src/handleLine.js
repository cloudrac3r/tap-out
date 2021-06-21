const parseLine = require('./parse')
const { isErrorOutputEnd } = require('./fns')

const isRawTapTestStatus = function (str) {
  let rawTapTestStatusRegex = new RegExp('(\\d+)(\\.)(\\.)(\\d+)')
  return rawTapTestStatusRegex.exec(str)
}

function handleLine(line) {
  let parsed = parseLine(line)

  // This will handle all the error stuff
  this._handleError(line)

  // This is weird, but it's the only way to distinguish a
  // console.log type output from an error output
  if (!this.writingErrorOutput && !parsed && !isErrorOutputEnd(line) && !isRawTapTestStatus(line)) {
    let comment = {
      type: 'comment',
      raw: line,
      test: this.testNumber,
    }
    this.emit('comment', comment)
    this.results.comments.push(comment)
  }

  // Invalid line
  if (!parsed) {
    this.previousLine = line
    return
  }

  // Handle tests
  if (parsed.type === 'test') {
    this.testNumber += 1
    parsed.number = this.testNumber
  }

  // Handle asserts
  if (parsed.type === 'assert') {
    parsed.test = this.testNumber
    this.results[parsed.ok ? 'pass' : 'fail'].push(parsed)

    if (parsed.ok) {
      // No need to have the error object
      // in a passing assertion
      delete parsed.error
      this.emit('pass', parsed)
    }
  }
  // This is all so we can determine if the "# ok" output on the last line
  // should be skipped
  const isOkLine = line === '# ok' && this.previousLine.indexOf('# pass') > -1

  if (!isOkLine) {
    this.emit(parsed.type, parsed)
    this.results[parsed.type + 's'].push(parsed)
  }

  this.previousLine = line
}
module.exports = handleLine
