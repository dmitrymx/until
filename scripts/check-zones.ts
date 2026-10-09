import assert from 'node:assert/strict'
import { formatWhenIn, to24, wallToUtc } from '../src/zones.ts'

assert.equal(to24(9, true), 21)
assert.equal(to24(12, false), 0)
assert.equal(to24(12, true), 12)
assert.equal(to24(1, false), 1)

const utc = wallToUtc(2026, 10, 22, 21, 0, 'America/Los_Angeles')
assert.ok(utc)
assert.equal(utc.toISOString(), '2026-10-23T04:00:00.000Z')

const samara = formatWhenIn(utc, 'Europe/Samara', 'ru')
const moscow = formatWhenIn(utc, 'Europe/Moscow', 'ru')
assert.equal(samara.time, '08:00')
assert.equal(moscow.time, '07:00')
assert.match(samara.day, /23/)
assert.match(moscow.day, /23/)

console.log('zones ok', samara, moscow)
