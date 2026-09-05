// ── Add these two models to your existing models/index.js ──
// Paste the schemas below alongside your existing ones (Journal, StoryCard, etc.)

import mongoose from 'mongoose'
const { Schema, model } = mongoose

// ── MusicTrack ───────────────────────────────────────────────────────────────
// One document per uploaded audio file. Scoped to a campaign so the whole
// party shares the playlist. `addedBy` lets you show who uploaded each track.
const MusicTrackSchema = new Schema({
  campaign:  { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  addedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  name:      { type: String, required: true, trim: true },
  url:       { type: String, required: true },   // Cloudinary secure_url
  publicId:  { type: String, default: '' },       // Cloudinary public_id (for future deletion)
  duration:  { type: Number, default: 0 },        // seconds
}, { timestamps: true })

export const MusicTrack = model('MusicTrack', MusicTrackSchema)

// ── MusicSession ─────────────────────────────────────────────────────────────
// A named session plan containing an ordered list of cue points.
// Each cue references a MusicTrack + a DM note for when to play it.
const CueSchema = new Schema({
  track: { type: Schema.Types.ObjectId, ref: 'MusicTrack' },
  label: { type: String, required: true, trim: true },
}, { _id: true })

const MusicSessionSchema = new Schema({
  campaign:  { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  name:      { type: String, required: true, trim: true },
  cues:      { type: [CueSchema], default: [] },
}, { timestamps: true })

export const MusicSession = model('MusicSession', MusicSessionSchema)
