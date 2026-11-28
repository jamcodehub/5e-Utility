// Lazy loader for the SRD 5.1 dataset (see scripts/build-srd.mjs).
// Each chunk is fetched on first use and cached, so pages only pay for what they open.
// SRD 5.1 content © Wizards of the Coast LLC, licensed CC-BY-4.0.

const loaders = {
  core:        () => import('../data/srd/core.json'),
  classes:     () => import('../data/srd/classes.json'),
  races:       () => import('../data/srd/races.json'),
  traits:      () => import('../data/srd/traits.json'),
  features:    () => import('../data/srd/features.json'),
  backgrounds: () => import('../data/srd/backgrounds.json'),
  equipment:   () => import('../data/srd/equipment.json'),
  spells:      () => import('../data/srd/spells.json'),
  rules:       () => import('../data/srd/rules.json'),
  rulesIndex:  () => import('../data/srd/rulesIndex.json'),
  monsters:    () => import('../data/srd/monsters.json'),
}

const cache = {}

export function loadSrd(name) {
  if (!loaders[name]) return Promise.reject(new Error(`Unknown SRD dataset: ${name}`))
  return (cache[name] ||= loaders[name]().then(m => m.default))
}

export async function loadSrdMany(...names) {
  const parts = await Promise.all(names.map(loadSrd))
  return Object.fromEntries(names.map((n, i) => [n, parts[i]]))
}

export const SRD_ATTRIBUTION =
  'This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.'
