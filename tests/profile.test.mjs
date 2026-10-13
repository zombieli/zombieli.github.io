import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateProfile } from '../scripts/validate-content.mjs'

const profile = () => JSON.parse(readFileSync(new URL('../src/data/profile.json', import.meta.url), 'utf8'))

test('confirmed profile is accepted without inspecting a presentation file', () => {
  assert.doesNotThrow(() => validateProfile(profile()))
})

test('incomplete contact and education records are rejected', () => {
  for (const field of ['name', 'email', 'location', 'degree', 'specialisation', 'university', 'graduation', 'internshipStart', 'availability', 'workRights', 'github', 'linkedin', 'resume']) {
    const input = profile()
    delete input[field]
    assert.throws(() => validateProfile(input), /profile/i, field)
  }
})

test('unconfirmed work rights, availability and graduation cannot replace confirmed facts', () => {
  for (const [field, value] of [['workRights', 'Unrestricted work rights'], ['availability', 'Full-time at any time'], ['graduation', 'Graduated June 2026'], ['internshipStart', 'Available immediately']]) {
    assert.throws(() => validateProfile({ ...profile(), [field]: value }), /profile/i)
  }
})

test('changed contact destinations are rejected for review', () => {
  for (const [field, value] of [['email', 'invalid'], ['github', 'javascript:alert(1)'], ['linkedin', 'http://wrong.example'], ['resume', '/resume/missing.pdf']]) {
    assert.throws(() => validateProfile({ ...profile(), [field]: value }), /profile/i)
  }
})
