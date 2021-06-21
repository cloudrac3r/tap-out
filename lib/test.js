const expr = require('./utils/regexes')

const test = function (line) {
  let m = expr.comment.exec(line)

  return {
    type: 'test',
    name: m[1],
    raw: line,
  }
}

test.equals = function (line) {
  // TODO: need a more thorough test for this???
  return line.indexOf('# ') === 0
}

module.exports = test
