const PassThrough = require('readable-stream/passthrough')
const split = require('split')
const trim = require('trim')
const util = require('util')
const EventEmitter = require('events').EventEmitter
const reemit = require('re-emitter')

// const expr = require('./lib/utils/regexes')
const parseLine = require('./lib/parse-line')
const error = require('./lib/error')

const isFailAssertionLine = function (line) {
  return line.indexOf('not ok') === 0
}

const isErrorOutputStart = function (line) {
  return line.indexOf('  ---') === 0
}

const isErrorOutputEnd = function (line) {
  // return line.indexOf('  ...') === 0
  return line === '  ...'
}

const splitFirst = function (str, pattern) {
  let parts = str.split(pattern)
  if (parts.length <= 1) {
    return parts
  }

  return [parts[0], parts.slice(1).join(pattern)]
}

const isRawTapTestStatus = function (str) {
  let rawTapTestStatusRegex = new RegExp('(\\d+)(\\.)(\\.)(\\d+)')
  return rawTapTestStatusRegex.exec(str)
}

const firstAssertion = function (first, assert) {
  return assert.number < first.number ? assert : first
}

const lastAssertion = function (last, assert) {
  return assert.number > last.number ? assert : last
}

function Parser() {
  if (!(this instanceof Parser)) {
    return new Parser()
  }

  EventEmitter.call(this)

  this.results = {
    tests: [],
    asserts: [],
    versions: [],
    results: [],
    comments: [],
    plans: [],
    pass: [],
    fail: [],
    errors: [],
  }
  this.testNumber = 0

  this.previousLine = ''
  this.currentNextLineError = null
  this.writingErrorOutput = false
  this.writingErrorStackOutput = false
  this.tmpErrorOutput = ''
}

util.inherits(Parser, EventEmitter)

Parser.prototype.handleLine = function handleLine(line) {
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

  if (!isOkLine(this.previousLine)) {
    this.emit(parsed.type, parsed)
    this.results[parsed.type + 's'].push(parsed)
  }

  // This is all so we can determine if the "# ok" output on the last line
  // should be skipped
  function isOkLine(previousLine) {
    return line === '# ok' && previousLine.indexOf('# pass') > -1
  }
  this.previousLine = line
}

Parser.prototype._handleError = function _handleError(line) {
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

      msg = msg.split(' ')[1].replace('(', '').replace(')', '')

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

Parser.prototype._handleEnd = function _handleEnd() {
  let plan = this.results.plans.length ? this.results.plans[0] : null
  let count = this.results.asserts.length
  let first = count && this.results.asserts.reduce(firstAssertion)
  let last = count && this.results.asserts.reduce(lastAssertion)

  // Emit fail when error on previous line had no diagnostics
  if (this.previousLine && isFailAssertionLine(this.previousLine)) {
    let lastAssert = this.results.fail[this.results.fail.length - 1]

    this.emit('fail', lastAssert)
  }

  if (!plan) {
    if (count > 0) {
      this.results.errors.push(error('no plan provided'))
    }
    return
  }

  if (this.results.fail.length > 0) {
    return
  }

  if (count !== plan.to - plan.from + 1) {
    this.results.errors.push(error('incorrect number of assertions made'))
  } else if (first && first.number !== plan.from) {
    this.results.errors.push(error('first assertion number does not equal the plan start'))
  } else if (last && last.number !== plan.to) {
    this.results.errors.push(error('last assertion number does not equal the plan end'))
  }
}

module.exports = function (done) {
  done = done || function () {}

  let stream = new PassThrough()
  let parser = Parser()
  reemit(parser, stream, ['test', 'assert', 'version', 'result', 'pass', 'fail', 'comment', 'plan'])

  stream
    .pipe(split())
    .on('data', function (data) {
      if (!data) {
        return
      }

      let line = data.toString()
      parser.handleLine(line)
    })
    .on('close', function () {
      parser._handleEnd()

      stream.emit('output', parser.results)

      done(null, parser.results)
    })
    .on('error', done)

  return stream
}

module.exports.Parser = Parser
