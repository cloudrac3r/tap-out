const error = function (message) {
  return {
    type: 'error',
    message: message,
  }
}

const isFailAssertionLine = function (line) {
  return line.indexOf('not ok') === 0
}

const isErrorOutputStart = function (line) {
  return line.indexOf('  ---') === 0
}

const isErrorOutputEnd = function (line) {
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

module.exports = {
  error,
  isFailAssertionLine,
  isErrorOutputStart,
  isErrorOutputEnd,
  splitFirst,
  isRawTapTestStatus,
  firstAssertion,
  lastAssertion,
}
