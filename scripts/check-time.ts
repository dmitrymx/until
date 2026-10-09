import assert from 'node:assert/strict'
import { breakdown } from '../src/time.ts'

function local(year: number, month: number, day: number, hour = 0, minute = 0, second = 0) {
  return new Date(year, month - 1, day, hour, minute, second)
}

const gta = breakdown(local(2026, 11, 19, 0, 0, 0), local(2026, 10, 9, 20, 51, 0))
assert.equal(gta.done, false)
assert.equal(gta.months, 1)
assert.equal(gta.days, 9)
assert.equal(gta.hours, 3)
assert.equal(gta.minutes, 9)
assert.equal(gta.seconds, 0)

const exact = breakdown(local(2026, 3, 15, 12), local(2026, 1, 15, 12))
assert.equal(exact.months, 2)
assert.equal(exact.days, 0)
assert.equal(exact.hours, 0)
assert.equal(exact.minutes, 0)

const clamp = breakdown(local(2026, 3, 1), local(2026, 1, 31))
assert.equal(clamp.months, 1)
assert.equal(clamp.days, 1)

const past = breakdown(local(2020, 1, 1), local(2026, 1, 1))
assert.equal(past.done, true)

const leap = breakdown(local(2028, 3, 1), local(2028, 1, 31))
assert.equal(leap.months, 1)
assert.equal(leap.days, 1)

console.log('time ok')
