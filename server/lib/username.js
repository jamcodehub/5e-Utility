// Rules for a username the user picks when renaming themselves (registration keeps its older, looser rules so no
// existing account is affected). Returns the cleaned name, or { error } saying what is wrong.
export const USERNAME_MIN = 3
export const USERNAME_MAX = 24

export function checkUsername(raw) {
  if (typeof raw !== 'string') return { error: 'Enter a username.' }
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length < USERNAME_MIN) return { error: `Usernames need at least ${USERNAME_MIN} characters.` }
  if (name.length > USERNAME_MAX) return { error: `Usernames can be at most ${USERNAME_MAX} characters.` }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _.'-]*$/u.test(name)) return { error: 'Use letters, numbers, spaces and . _ - \' only, starting with a letter or number.' }
  return { name }
}
