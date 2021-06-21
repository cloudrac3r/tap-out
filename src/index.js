const PassThrough = require('readable-stream/passthrough')
const EventEmitter = require('events').EventEmitter
const split = require('split')
const util = require('util')
const reemit = require('re-emitter')
const handleLine = require('./handleLine')
const handleEnd = require('./handleEnd')
const handleError = require('./handleError')

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

Parser.prototype.handleLine = handleLine

Parser.prototype._handleError = handleError

Parser.prototype._handleEnd = handleEnd

const factory = function (done) {
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
// include this in the exports, too
factory.Parser = Parser

module.exports = factory
