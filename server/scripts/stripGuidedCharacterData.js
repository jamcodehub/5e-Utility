// One-off migration: the guided "WOTC" character creator and SRD-driven level-up
// wizard have been removed in favour of the Custom Character builder only. This
// resets every existing character's SRD identity/progression fields to the same
// "custom" shape the Custom builder now produces, so nothing in the app still
// treats them as guided-creator characters (e.g. an old "Level Up" entry point).
//
// Left untouched on purpose:
//   - srd.skills / srd.languages — Custom builder sets these too, still valid.
//   - srd.equipment — the Gear tab's per-character item list, unrelated to this.
//   - spells — orphaned now that per-character spell tracking is gone, but the
//     saved data is harmless to leave in place.
//
// Run with the same MONGO_URI the server uses, e.g.:
//   MONGO_URI="mongodb+srv://..." node server/scripts/stripGuidedCharacterData.js
import 'dotenv/config'
import mongoose from 'mongoose'
import { Character } from '../models/index.js'

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Run this with the same MONGO_URI the server uses.')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected. Stripping guided-creator SRD data from existing characters…')

  const result = await Character.updateMany({}, {
    $set: {
      'srd.raceId': '',
      'srd.subclassId': '',
      'srd.classId': '',
      'srd.backgroundId': 'custom',
      'srd.abilityMethod': 'manual',
      'srd.custom': true,
      'srd.features': [],
      'srd.hpRolls': [],
      'srd.hitDiceUsed': 0,
      'srd.featureUsed': {},
      'srd.feats': [],
      'srd.asiLog': [],
    },
  })

  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount} character(s).`)
  await mongoose.disconnect()
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
