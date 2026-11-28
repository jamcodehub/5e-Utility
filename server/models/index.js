import mongoose from 'mongoose'
const { Schema, model } = mongoose

const UserSchema = new Schema({
  username:         { type: String, required: true, unique: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String },
  role:             { type: String, enum: ['dm', 'player'], default: 'player' },
  // Every identity this account has used. `role` is the one currently active.
  roles:            [{ type: String, enum: ['dm', 'player'] }],
  phone:            { type: String, default: '' },
  googleId:         { type: String, default: '', index: true, sparse: true },
  avatar:           { type: String, default: '' },
  isPremium:        { type: Boolean, default: false },
  // By-hand premium switches (flip to true in MongoDB; Stripe never changes them). DM covers both sides.
  playerPremiumGrant: { type: Boolean, default: false },
  dmPremiumGrant:     { type: Boolean, default: false },
  // Which role the subscription was bought for ('player' or 'dm'); '' on accounts made premium before this existed (= player).
  premiumRole:      { type: String, enum: ['', 'player', 'dm'], default: '' },
  // A DM's "test player": a placeholder account that cannot sign in (no password). Set on the DM's campaign it belongs to.
  placeholderOf:       { type: Schema.Types.ObjectId, ref: 'User', default: null },
  placeholderCampaign: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null, index: true },
  stripeCustomerId: { type: String, default: '' },
  stripeSubId:      { type: String, default: '' },
  // Failed-payment grace period: premium stays on until graceEndsAt.
  graceEndsAt:      { type: Date, default: null },
  graceReminderSent: { type: Boolean, default: false },
  twoFactorEnabled:     { type: Boolean, default: false },
  twoFactorCode:        { type: String, default: '' },
  twoFactorCodeExpires: { type: Date },
  // '' = legacy account (email OTP when twoFactorEnabled). 'google' = verified
  // with a Google account at sign-up; 'email' = email confirmed by a code at
  // sign-up. Either one doubles as the 2FA factor on new devices.
  twoFactorMethod:      { type: String, enum: ['', 'google', 'email'], default: '' },
  // Devices that already passed 2FA (sha256 of a per-browser id).
  trustedDevices:       [{ _id: false, hash: String, label: String, lastUsedAt: Date, expiresAt: Date }],
  resetPasswordToken:   { type: String, default: '' },
  resetPasswordExpires: { type: Date },
}, { timestamps: true })

// A sign-up waiting for its emailed code. Kept apart from User so an
// unconfirmed attempt never owns an email/username; it expires on its own.
const PendingSignupSchema = new Schema({
  email:         { type: String, required: true, unique: true, lowercase: true },
  username:      { type: String, required: true, trim: true },
  password:      { type: String, required: true }, // bcrypt hash
  role:          { type: String, enum: ['dm', 'player'], default: 'player' },
  codeHash:      { type: String, required: true }, // sha256 of the emailed code
  codeExpiresAt: { type: Date, required: true },
  attempts:      { type: Number, default: 0 },
  lastSentAt:    { type: Date, default: Date.now },
  expiresAt:     { type: Date, required: true, index: { expireAfterSeconds: 0 } },
})

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
  tag:      { type: String, enum: ['npc', 'location', 'item', 'faction', 'event', 'enemy', 'boss'], default: 'npc' },
  content:  String,
  imageUrl: String,
  hp:       { type: Number, default: null },   // current HP (npc/enemy/boss)
  maxHp:    { type: Number, default: null },   // max HP
}, { timestamps: true })

const StoryCardSchema = new Schema({
  campaign:    { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  title:       { type: String, required: true },
  description: String,
  prompt:      String,
  imageUrl:    String,
  day:         Number,
}, { timestamps: true })

const DMBoardSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  name: { type: String, default: 'Main board', trim: true, maxlength: 80 },
  folder: { type: Schema.Types.ObjectId, ref: 'DMBoardFolder', default: null },
  board: { type: Schema.Types.Mixed, required: true },
  version: { type: Number, required: true },
}, { timestamps: true })

// The DM's running battle (combatants, initiative, turn, round, log) so it survives reloads. One per campaign.
const BattleStateSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },
  state:    { type: Schema.Types.Mixed, required: true },
}, { timestamps: true })

const DMBoardFolderSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
}, { timestamps: true })

const CharacterSchema = new Schema({
  campaign:     { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  owner:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Multiple characters per owner per campaign are now supported (2 free /
  // unlimited premium). `isPrimary` marks the one shown by default and used
  // by back-compat single-character consumers (Roleplay Assistant, the DM's
  // members/characters roster, etc).
  isPrimary:    { type: Boolean, default: false },
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
  // Optional SRD 5.1 build data, written by the guided creator / level-up.
  // Sheets without it keep working exactly as before.
  srd: {
    raceId: String, subraceId: String, classId: String, subclassId: String, backgroundId: String,
    abilityMethod: String,
    custom: { type: Boolean, default: false },
    skills: [String],
    expertise: [String],
    languages: [String],
    features: [String],
    equipment: [{ _id: false, id: String, qty: { type: Number, default: 1 }, equipped: Boolean, attuned: Boolean, custom: Boolean, name: String, weight: Number, note: String }],
    hpRolls: [Number],
    hitDiceUsed: { type: Number, default: 0 },
    featureUsed: { type: Map, of: Number, default: {} },
    feats: [String],
    asiLog: [{ _id: false, level: Number, increases: [String] }],
  },
  // Table-play state: HP extras, conditions, death saves, coin, companions, sharing.
  combat: {
    tempHp: { type: Number, default: 0 },
    conditions: [String],
    exhaustion: { type: Number, default: 0 },
    inspiration: { type: Boolean, default: false },
    concentrating: { type: String, default: '' },
    deathSaves: { successes: { type: Number, default: 0 }, failures: { type: Number, default: 0 } },
  },
  currency: { cp: { type: Number, default: 0 }, sp: { type: Number, default: 0 }, ep: { type: Number, default: 0 }, gp: { type: Number, default: 0 }, pp: { type: Number, default: 0 } },
  companions: [{ _id: false, id: String, name: String, hp: { current: Number, max: Number }, ac: Number, notes: String }],
  shareToken: { type: String, index: true, sparse: true },
  spells: {
    cantrips: [String],
    known: [String],
    prepared: [String],
    slotsUsed: { type: Map, of: Number, default: {} },
  },
}, { timestamps: true })

// Non-unique index (kept for query performance) — players may now have
// multiple character docs per campaign, distinguished by `isPrimary`/_id.
CharacterSchema.index({ campaign: 1, owner: 1 })


const LevelPlanSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  owner:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  content:  { type: String, default: '' },
  // Live token positions for the collaborative Play mode board — persisted
  // so the board survives reloads and stays in sync across everyone viewing it.
  tokens:   { type: Schema.Types.Mixed, default: [] },
  darkMode: { type: Boolean, default: false },
  doorStates: { type: Schema.Types.Mixed, default: [] },
  // Which doors are locked (grid of booleans, see lib/doors.js). A locked door only the DM can unlock.
  doorLocks: { type: Schema.Types.Mixed, default: [] },
  // Tile art theme. A map has exactly one theme (grids store tile ids; the theme only decides the artwork).
  // Without this field Mongoose silently dropped the theme, so every saved map came back as Medieval.
  theme:    { type: String, default: 'medieval' },
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
    status:            { type: String, enum: ['not-started', 'active', 'completed', 'failed'], default: 'active' },
    kind:              { type: String, enum: ['main', 'side', ''], default: '' },   // 'main' = main story, 'side' = side quest, '' = not sorted
    order:             { type: Number, default: 0 },                                  // place in its group, 1 is first
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
export const PendingSignup = model('PendingSignup', PendingSignupSchema)
export const Campaign      = model('Campaign', CampaignSchema)
export const Journal       = model('Journal', JournalSchema)
export const Lore          = model('Lore', LoreSchema)
export const StoryCard     = model('StoryCard', StoryCardSchema)
export const DMBoard       = model('DMBoard', DMBoardSchema)
export const DMBoardFolder = model('DMBoardFolder', DMBoardFolderSchema)
export const BattleState  = model('BattleState', BattleStateSchema)
export const Character     = model('Character', CharacterSchema)
export const LevelPlan     = model('LevelPlan', LevelPlanSchema)
// What each subscriber has used of their monthly AI allowance (one document per user per month, 'YYYY-MM').
const AiUsageSchema = new Schema({
  user:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month:  { type: String, required: true },
  guide:  { type: Number, default: 0 },
  images: { type: Number, default: 0 },
}, { timestamps: true })
AiUsageSchema.index({ user: 1, month: 1 }, { unique: true })

export const Inventory     = model('Inventory', InventorySchema)
export const AiUsage       = model('AiUsage', AiUsageSchema)
export const CampaignGuide = model('CampaignGuide', CampaignGuideSchema)
export const MusicTrack    = model('MusicTrack', MusicTrackSchema)
export const MusicSession  = model('MusicSession', MusicSessionSchema)
