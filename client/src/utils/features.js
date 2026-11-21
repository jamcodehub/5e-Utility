// The AI features (the world-building guide and scene image generation) are switched off until they work reliably.
// To bring them back, set VITE_AI_ENABLED=true for the site build and AI_ENABLED=true on the server.
export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true'
