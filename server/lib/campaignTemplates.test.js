import test from 'node:test'
import assert from 'node:assert/strict'
import { CAMPAIGN_TEMPLATES } from '../data/campaigns/index.js'
import { templateProblems, templateSummaries, findTemplate } from './campaignTemplates.js'

test('every ready-made campaign is complete', () => {
  assert.ok(CAMPAIGN_TEMPLATES.length >= 1)
  for (const t of CAMPAIGN_TEMPLATES) assert.deepEqual(templateProblems(t), [], `${t.id} has problems`)
})

test('ids are unique, and exactly one campaign is free', () => {
  const ids = CAMPAIGN_TEMPLATES.map(t => t.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(CAMPAIGN_TEMPLATES.filter(t => !t.premium).length, 1)
  assert.equal(CAMPAIGN_TEMPLATES[0].premium, false, 'the free one comes first')
})

test('the picker list hides the content and locks premium ones for free DMs', () => {
  const free = templateSummaries(false)
  const paid = templateSummaries(true)
  assert.ok(free.every(s => !('guide' in s) && !('lore' in s) && typeof s.sessions === 'number'))
  assert.equal(free[0].locked, false)
  assert.ok(free.slice(1).every(s => s.locked))
  assert.ok(paid.every(s => !s.locked))
  assert.equal(findTemplate('nope'), null)
  assert.equal(findTemplate(CAMPAIGN_TEMPLATES[0].id).id, CAMPAIGN_TEMPLATES[0].id)
})

test('puzzle answers and encounter numbers are written into the session plans', () => {
  for (const t of CAMPAIGN_TEMPLATES) for (const s of t.sessions) {
    assert.match(s.content, /PUZZLE/, `${t.id}: ${s.title} has no puzzle`)
    assert.match(s.content, /SOLUTION/, `${t.id}: ${s.title} gives no solution`)
    assert.match(s.content, /EASY/, `${t.id}: ${s.title} has no difficulty scaling`)
    assert.match(s.content, /ROLE SPOTLIGHTS/, `${t.id}: ${s.title} has no role spotlights`)
  }
})
