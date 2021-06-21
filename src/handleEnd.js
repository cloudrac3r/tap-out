const { error, isFailAssertionLine, firstAssertion, lastAssertion } = require('./fns')

const handleEnd = function () {
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
module.exports = handleEnd
