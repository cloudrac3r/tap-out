#!/usr/bin/env node

let tapOut = require('../')

let parser = tapOut(function (err, output) {
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
