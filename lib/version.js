const expr = require('./utils/regexes')

const version = function (line) {
  return {
    type: 'version',
    raw: line,
  }
}

version.equals = function (line) {
  return expr.version.test(line)
}

module.exports = version
