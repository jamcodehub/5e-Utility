// Two paid plans: Player Premium ($5) and DM Premium ($15). DM Premium includes everything in Player Premium, so it
// covers both roles; Player Premium covers the player side only. `premiumRole` is the plan the account holds ('player' or
// 'dm'), stamped by Stripe checkout; accounts made premium before that field existed (empty) count as Player premium.
export const premiumRoleOf = (user) => (user?.premiumRole === 'dm' ? 'dm' : 'player')

// Is this account premium for the given side (what its tools check)?
export const hasPremiumAs = (user, role) => !!user?.isPremium && (role === 'player' || premiumRoleOf(user) === 'dm')

// Both sides at a glance, for the site to read: Player Premium, and DM Premium (which includes Player Premium).
export const planFlags = (user) => ({ isPlayerPremium: hasPremiumAs(user, 'player'), isDmPremium: hasPremiumAs(user, 'dm') })

// Accounts that went premium before there were two plans have an empty `premiumRole`, which counts as Player Premium. This
// writes that down ('player') so the database says which plan every paying account holds. Safe to run any number of times;
// returns how many accounts it changed.
export const stampLegacyPlans = async (User) => {
  const result = await User.updateMany({ isPremium: true, premiumRole: { $in: ['', null] } }, { premiumRole: 'player' })
  return result?.modifiedCount ?? 0
}

// Premium for the role the account is currently acting as.
export const hasPremium = (user) => hasPremiumAs(user, user?.role === 'dm' ? 'dm' : 'player')

// Stripe prices: one per plan (STRIPE_PRICE_ID_PLAYER, STRIPE_PRICE_ID_DM). The old single STRIPE_PRICE_ID still works as a
// fallback so a deploy never breaks checkout.
export const priceFor = (plan, env = process.env) => (plan === 'dm' ? env.STRIPE_PRICE_ID_DM : env.STRIPE_PRICE_ID_PLAYER) || env.STRIPE_PRICE_ID
// Which plan a Stripe price belongs to (null if it is not one of ours).
export const planForPrice = (priceId, env = process.env) => {
  if (!priceId) return null
  if (priceId === env.STRIPE_PRICE_ID_DM) return 'dm'
  if (priceId === env.STRIPE_PRICE_ID_PLAYER) return 'player'
  return null
}
