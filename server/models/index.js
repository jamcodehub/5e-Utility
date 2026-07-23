import mongoose from 'mongoose'
const { Schema, model } = mongoose

const UserSchema = new Schema({
  username:         { type: String, required: true, unique: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String },
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
  members:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

const JournalSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  author:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  day:      { type: Number, required: true },
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
  // Array of skill names that are proficient e.g. ['Athletics', 'Investigation']
  proficiencies: [{ type: String }],
  notes:        String,
}, { timestamps: true })

export const User       = model('User', UserSchema)
export const Campaign   = model('Campaign', CampaignSchema)
export const Journal    = model('Journal', JournalSchema)
export const Lore       = model('Lore', LoreSchema)
export const StoryCard  = model('StoryCard', StoryCardSchema)
export const Character  = model('Character', CharacterSchema)
