#!/usr/bin/env node
const tapIn = require('../')

let parser = tapIn(function (err, output) {
  if (err) {
    throw err
  }

  let out = output

  try {
    out = JSON.stringify(output, null, 2)
  } catch (e) {}

  process.stdout.write(out)
})

process.stdin.pipe(parser)
