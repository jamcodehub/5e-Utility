// Where the Godot game (map generator and live 3D view) is served from.
//  - VITE_GODOT_MAP_URL, if set when the site is built, wins (use it to point somewhere else, or at a local copy while developing).
//  - The real site (a production build) uses the game's own site, so nothing needs setting on Netlify.
//  - A development build (npm run dev) expects the game under /godot/map-generator/ on the same server.
// The game only lets 5eutility.com, www.5eutility.com and localhost embed it (see build/web/_headers in the game project).
export const HOSTED_GAME_URL = 'https://maptilecreator.netlify.app/index.html'
export const GAME_URL = import.meta.env.VITE_GODOT_MAP_URL || (import.meta.env.PROD ? HOSTED_GAME_URL : '/godot/map-generator/index.html')
