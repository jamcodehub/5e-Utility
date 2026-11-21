// Open-air maps. With the lighting (fog of war) on, an outdoor map is night: dim blue moonlight you can still make shapes out in,
// with torch light fading out into it. An indoor map (a dungeon, a cave) stays pitch black where no light reaches.
// A map can say which it is (`outdoor` in its saved content, which the map generator writes and the editor can set); a map that
// does not say is guessed from its ground.

// How bright moonlight is, compared with full light (matches NIGHT_LEVEL in the Godot game's lighting.gd).
export const NIGHT_LEVEL = 0.2

const OPEN_AIR = new Set(['grass', 'sand', 'snow', 'water'])
const NOT_COUNTED = new Set(['empty', 'wall', 'wood-wall'])

// Is at least about a third of the ground open air (grass, sand, snow, water)? Cave floors (rocky dirt) do not count, so caves
// stay indoors.
export function guessOutdoor(ground) {
  let open = 0
  let total = 0
  for (const row of ground || []) {
    for (const tile of row || []) {
      if (!tile || NOT_COUNTED.has(tile)) continue
      total++
      if (OPEN_AIR.has(tile)) open++
    }
  }
  return total > 0 && open / total >= 0.3
}

// The map's own word if it has one (true or false), otherwise a guess.
export function isOutdoorMap(flag, ground) {
  return typeof flag === 'boolean' ? flag : guessOutdoor(ground)
}
