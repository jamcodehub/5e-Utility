import mongoose from 'mongoose'
const { Schema, model } = mongoose

const UserSchema = new Schema({
  username:         { type: String, required: true, unique: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String },
  role:             { type: String, enum: ['dm', 'player'], default: 'player' },
  phone:            { type: String, default: '' },
  googleId:         { type: String, default: '', index: true, sparse: true },
  avatar:           { type: String, default: '' },
  isPremium:        { type: Boolean, default: false },
  stripeCustomerId: { type: String, default: '' },
  stripeSubId:      { type: String, default: '' },
  twoFactorEnabled:     { type: Boolean, default: false },
  twoFactorCode:        { type: String, default: '' },
  twoFactorCodeExpires: { type: Date },
}, { timestamps: true })

const CampaignSchema = new Schema({
  owner:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  description: String,
  setting:     String,
  coverImage:  String,
  joinCode:        { type: String, unique: true, sparse: true, index: true },
  members:         [{ type: Schema.Types.ObjectId, ref: 'User' }],
  pendingMembers:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPersonal:      { type: Boolean, default: false },
}, { timestamps: true })

const JournalSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  author:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  day:      { type: Number },     // players use this
  session:  { type: Number },     // DMs use this
  title:    String,
  content:  { type: String, default: '' },
}, { timestamps: true })

const LoreSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  title:    { type: String, required: true },
  tag:      { type: String, enum: ['npc', 'location', 'item', 'faction', 'event'], default: 'npc' },
  content:  String,
  imageUrl: String,
}, { timestamps: true })

const StoryCardSchema = new Schema({
  campaign:    { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  title:       { type: String, required: true },
  description: String,
  prompt:      String,
  imageUrl:    String,
  day:         Number,
}, { timestamps: true })

const CharacterSchema = new Schema({
  campaign:     { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  owner:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  avatarUrl:    { type: String },
  appearancePrompt: { type: String },
  name:         String,
  race:         String,
  class:        String,
  level:        Number,
  dndBeyondUrl: String,
  stats:        { str: Number, dex: Number, con: Number, int: Number, wis: Number, cha: Number },
  hp:           { current: Number, max: Number },
  ac:           Number,
  profBonus:    Number,
  proficiencies: [{ type: String }],
  notes:        String,
  background:   { type: String, default: '' },
  personality:  { type: String, default: '' },
  goals:        { type: String, default: '' },
  lore:         { type: String, default: '' },
  roleplaySessionCount: { type: Number, default: 0 },
}, { timestamps: true })

const LevelPlanSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  owner:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  content:  { type: String, default: '' },
}, { timestamps: true })

const InventorySchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  owner:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  currency: {
    pp: { type: Number, default: 0 },
    gp: { type: Number, default: 0 },
    ep: { type: Number, default: 0 },
    sp: { type: Number, default: 0 },
    cp: { type: Number, default: 0 },
  },
  items: [{
    id:       { type: String },
    name:     { type: String, required: true },
    qty:      { type: Number, default: 1 },
    weight:   { type: Number },
    value:    { type: String },
    notes:    { type: String },
    equipped: { type: Boolean, default: false },
  }],
}, { timestamps: true })

const CampaignGuideSchema = new Schema({
  campaign:    { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },
  story:       { type: String, default: '' },
  currentArc:  { type: String, default: '' },
  lastSession: { type: String, default: '' },
  worldNotes:  { type: String, default: '' },
  npcs: [{
    id:                { type: String },
    name:              { type: String, default: '' },
    description:       { type: String, default: '' },
    characterRelation: { type: String, default: '' },
  }],
  quests: [{
    id:                { type: String },
    title:             { type: String, default: '' },
    description:       { type: String, default: '' },
    status:            { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
    characterRelation: { type: String, default: '' },
  }],
}, { timestamps: true })

// ── MusicTrack ───────────────────────────────────────────────────────────────
const MusicTrackSchema = new Schema({
  campaign:  { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  addedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  name:      { type: String, required: true, trim: true },
  url:       { type: String, required: true },
  publicId:  { type: String, default: '' },
  duration:  { type: Number, default: 0 },
}, { timestamps: true })

// ── MusicSession ─────────────────────────────────────────────────────────────
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

export const User          = model('User', UserSchema)
export const Campaign      = model('Campaign', CampaignSchema)
export const Journal       = model('Journal', JournalSchema)
export const Lore          = model('Lore', LoreSchema)
export const StoryCard     = model('StoryCard', StoryCardSchema)
export const Character     = model('Character', CharacterSchema)
export const LevelPlan     = model('LevelPlan', LevelPlanSchema)
export const Inventory     = model('Inventory', InventorySchema)
export const CampaignGuide = model('CampaignGuide', CampaignGuideSchema)
export const MusicTrack    = model('MusicTrack', MusicTrackSchema)
export const MusicSession  = model('MusicSession', MusicSessionSchema)
