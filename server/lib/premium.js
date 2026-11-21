// Premium belongs to the role it was bought for: a Player subscription does not unlock the DM tools, and a DM subscription
// does not unlock the player extras. `premiumRole` is stamped by Stripe checkout; accounts that were made premium before
// that field existed (empty) count as Player premium.
export const premiumRoleOf = (user) => (user?.premiumRole === 'dm' ? 'dm' : 'player')

// Is this account premium for the given role?
export const hasPremiumAs = (user, role) => !!user?.isPremium && premiumRoleOf(user) === role

// Premium for the role the account is currently acting as.
export const hasPremium = (user) => hasPremiumAs(user, user?.role === 'dm' ? 'dm' : 'player')
