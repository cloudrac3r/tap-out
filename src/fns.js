const isFailAssertionLine = function (line) {
  return line.indexOf('not ok') === 0
}

const isErrorOutputEnd = function (line) {
  return line === '  ...'
}

module.exports = {
  isFailAssertionLine,
  isErrorOutputEnd,
}
