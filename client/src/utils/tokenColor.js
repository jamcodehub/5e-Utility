// One colour per kind of token, shared by the battle map and the battle tracker: players green, enemies red,
// bosses amber, friendly NPCs blue. Worked out from the token's type, so maps saved with the old purple still update.
const BY_TYPE = { player: 'var(--green)', enemy: 'var(--red)', boss: '#f59e0b', npc: '#4f7cac' }
export const tokenColor = (token) => BY_TYPE[token?.type] || token?.color || 'var(--green)'
