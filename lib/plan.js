const expr = require('./utils/regexes')

const plan = function (line) {
  let m = expr.plan.exec(line)
  return {
    type: 'plan',
    raw: line,
    from: m[1] && Number(m[1]),
    to: m[2] && Number(m[2]),
    skip: m[3],
  }
}

plan.equals = function (line) {
  return expr.plan.test(line)
}
module.exports = plan
