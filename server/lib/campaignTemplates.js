import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CampaignGuide, Lore, Journal, LevelPlan } from '../models/index.js'
import { CAMPAIGN_TEMPLATES } from '../data/campaigns/index.js'
import { locksFromContent } from './doors.js'

const MAPS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'campaigns', 'maps')

// One ready-made battle map, read from its file: { title, theme, darkMode, content, doorStates }. Null if the file is missing or broken.
export function readTemplateMap(templateId, slug) {
  try { return JSON.parse(fs.readFileSync(path.join(MAPS_DIR, templateId, `${slug}.json`), 'utf8')) } catch { return null }
}

// The ready-made campaigns a DM can start from instead of a blank page. Each carries a Campaign Guide (story, arc, world notes,
// NPCs, quests), lore cards (NPCs, places, factions, foes, bosses) and a plan for every session, which is saved into the DM's
// session planner. `premium: false` marks the free one; the rest need DM Premium.

const LORE_TAGS = ['npc', 'location', 'item', 'faction', 'event', 'enemy', 'boss']

export const findTemplate = (id) => CAMPAIGN_TEMPLATES.find(t => t.id === id) || null

// What the picker shows: no story content, just enough to choose.
export const templateSummaries = (canUsePremium) => CAMPAIGN_TEMPLATES.map(t => ({
  id: t.id, title: t.title, tagline: t.tagline, levels: t.levels, sessions: t.sessions.length, maps: t.maps.length, tone: t.tone, pitch: t.pitch,
  premium: t.premium, locked: t.premium && !canUsePremium,
}))

// A template is only good if it is complete; the tests run this over every campaign.
export function templateProblems(t) {
  const problems = []
  const need = (ok, what) => { if (!ok) problems.push(`${t.id || '?'}: ${what}`) }
  need(typeof t.id === 'string' && /^[a-z0-9-]+$/.test(t.id), 'id')
  for (const k of ['title', 'tagline', 'levels', 'tone', 'pitch']) need(typeof t[k] === 'string' && t[k].trim().length > 3, k)
  need(typeof t.premium === 'boolean', 'premium flag')
  const g = t.guide || {}
  for (const k of ['story', 'worldNotes']) need(typeof g[k] === 'string' && g[k].length > 200, `guide.${k}`)
  need(typeof g.currentArc === 'string' && g.currentArc.length > 60, 'guide.currentArc')
  need(Array.isArray(g.npcs) && g.npcs.length >= 5 && g.npcs.every(n => n.name && n.description && n.characterRelation), 'guide.npcs')
  need(Array.isArray(g.quests) && g.quests.length >= 4 && g.quests.every(q => q.title && q.description), 'guide.quests')
  need(Array.isArray(t.lore) && t.lore.length >= 12 && t.lore.every(l => l.title && LORE_TAGS.includes(l.tag) && l.content?.length > 40), 'lore')
  need(t.lore?.some(l => l.tag === 'boss') && t.lore?.some(l => l.tag === 'enemy') && t.lore?.some(l => l.tag === 'location') && t.lore?.some(l => l.tag === 'faction'), 'lore needs a boss, enemies, places and factions')
  need(t.lore?.filter(l => l.tag === 'enemy' || l.tag === 'boss').every(l => Number.isInteger(l.maxHp) && l.maxHp > 0), 'enemies and bosses need hit points')
  need(Array.isArray(t.sessions) && t.sessions.length >= 6 && t.sessions.every(s => s.title && s.content?.length > 800), 'sessions')
  need(Array.isArray(t.maps) && t.maps.length >= 5 && new Set(t.maps).size === t.maps.length, 'maps')
  for (const slug of t.maps || []) {
    const m = readTemplateMap(t.id, slug)
    let grid = null
    try { grid = JSON.parse(m.content) } catch { /* reported below */ }
    need(Boolean(m?.title) && Array.isArray(grid?.ground) && grid.ground.length >= 10 && Array.isArray(grid?.objects) && grid.objects.length === grid.ground.length, `map ${slug} is missing or broken`)
  }
  need(Array.isArray(t.sessionMaps) && t.sessionMaps.length === t.sessions?.length && t.sessionMaps.every(list => list.length > 0 && list.every(slug => t.maps?.includes(slug))), 'sessionMaps')
  return problems
}

// Creates everything a template carries inside a new campaign. `userId` is the DM (author of the session plans).
export async function seedCampaign(campaign, template, userId) {
  const g = template.guide
  const stamp = (list, prefix) => list.map((item, i) => ({ ...item, id: `${prefix}-${i + 1}` }))
  await CampaignGuide.create({
    campaign: campaign._id, story: g.story, currentArc: g.currentArc, lastSession: g.lastSession || '', worldNotes: g.worldNotes,
    npcs: stamp(g.npcs, 'npc'), quests: stamp(g.quests.map(q => ({ status: 'active', ...q })), 'quest'),
  })
  await Lore.insertMany(template.lore.map(l => ({
    campaign: campaign._id, title: l.title, tag: l.tag, content: l.content,
    hp: l.maxHp ?? null, maxHp: l.maxHp ?? null,
  })))
  // The battle maps go into the campaign map list, ready to play.
  const titles = {}
  for (const slug of template.maps) {
    const m = readTemplateMap(template.id, slug)
    if (!m) continue
    titles[slug] = m.title
    await LevelPlan.create({
      campaign: campaign._id, owner: userId, title: m.title, content: m.content, theme: m.theme || 'medieval',
      darkMode: Boolean(m.darkMode), doorStates: m.doorStates || [], doorLocks: locksFromContent(m.content), tokens: [],
    })
  }
  // Each session plan says which of those maps it uses.
  await Journal.insertMany(template.sessions.map((s, i) => {
    const used = (template.sessionMaps[i] || []).map(slug => titles[slug]).filter(Boolean)
    const mapLine = used.length ? `\n\nBATTLE MAPS (already in your Maps tab): ${used.join('; ')}.` : ''
    return { campaign: campaign._id, author: userId, session: i + 1, title: s.title, content: s.content + mapLine }
  }))
}
