// Where the Godot game (map generator and live 3D view) is served from. Set VITE_GODOT_MAP_URL to host it somewhere else;
// otherwise it is expected on this site, under /godot/map-generator/.
export const GAME_URL = import.meta.env.VITE_GODOT_MAP_URL || '/godot/map-generator/index.html'
