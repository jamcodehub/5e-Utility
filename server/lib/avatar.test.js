import test from 'node:test'
import assert from 'node:assert/strict'
import { validAvatarUrl } from './avatar.js'

const me = '507f1f77bcf86cd799439011', other = '507f1f77bcf86cd799439012'
const mine = `https://res.cloudinary.com/crcbzpw6/image/upload/v1795091290/lore-ledger/${me}/abc_123.png`

test('accepts an image the user uploaded to their own Cloudinary folder', () => {
  assert.ok(validAvatarUrl(mine, me, 'crcbzpw6'))
  assert.ok(validAvatarUrl(`https://res.cloudinary.com/crcbzpw6/image/upload/lore-ledger/${me}/x.JPG`, me, 'crcbzpw6'), 'no version segment, upper-case extension')
  assert.ok(validAvatarUrl(mine, me, undefined), 'any cloud name when none is configured (local dev)')
})

test('refuses everything else', () => {
  for (const bad of [
    `https://res.cloudinary.com/crcbzpw6/image/upload/v1/lore-ledger/${other}/abc.png`, // someone else's folder
    `https://res.cloudinary.com/othercloud/image/upload/v1/lore-ledger/${me}/abc.png`,  // a different Cloudinary account
    `http://res.cloudinary.com/crcbzpw6/image/upload/v1/lore-ledger/${me}/abc.png`,     // not https
    `https://evil.example.com/crcbzpw6/image/upload/v1/lore-ledger/${me}/abc.png`,      // other host
    `https://res.cloudinary.com.evil.com/crcbzpw6/image/upload/v1/lore-ledger/${me}/abc.png`,
    `https://res.cloudinary.com/crcbzpw6/image/upload/v1/lore-ledger/${me}/abc.svg`,    // not an allowed image type
    `${mine}?x=1`, `${mine}#x`, `https://user:pw@res.cloudinary.com/crcbzpw6/image/upload/v1/lore-ledger/${me}/abc.png`,
    `https://res.cloudinary.com/crcbzpw6/image/upload/v1/lore-ledger/${me}/../${other}/abc.png`,
    `https://res.cloudinary.com/crcbzpw6/image/upload/v1/lore-ledger/${me}/a/b.png`,
    '', 'not a url', null, undefined, 42, {}, 'x'.repeat(600),
  ]) assert.equal(validAvatarUrl(bad, me, 'crcbzpw6'), false, String(bad).slice(0, 80))
  assert.equal(validAvatarUrl(mine, 'not-an-id', 'crcbzpw6'), false)
})
