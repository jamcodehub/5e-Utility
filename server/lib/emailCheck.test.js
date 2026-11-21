import test from 'node:test'
import assert from 'node:assert/strict'
import { emailFormatProblem, emailProviderProblem, PROVIDER_MESSAGE } from './emailCheck.js'

test('emailFormatProblem accepts real-looking addresses', () => {
  for (const e of ['jane@gmail.com', 'a.b+tag@outlook.com', 'me@my-company.co.uk', 'x@sub.domain.org', 'Jane@Gmail.com'])
    assert.equal(emailFormatProblem(e), null, e)
})

test('emailFormatProblem rejects placeholder, disposable and malformed addresses', () => {
  for (const e of ['a@user.com', 'a@example.com', 'a@test.com', 'a@foo.example.com', 'a@site.test'])
    assert.equal(emailFormatProblem(e), 'Please use a real email address', e)
  for (const e of ['a@mailinator.com', 'a@sub.mailinator.com', 'a@yopmail.com', 'a@guerrillamail.com'])
    assert.match(emailFormatProblem(e), /Disposable/, e)
  for (const e of ['', 'plain', '@gmail.com', 'a@', 'a b@gmail.com', 'a@gmail', 'a@localhost', 'a@-bad.com', 'a@gm_ail.com', 'a@gmail.c', null, 42, { $ne: 1 }])
    assert.equal(emailFormatProblem(e), 'Invalid email address', String(e))
})

test('emailProviderProblem only allows Gmail, Outlook and iCloud families by default', () => {
  delete process.env.ALLOWED_EMAIL_DOMAINS
  for (const e of ['a@gmail.com', 'A@Gmail.com', 'a@googlemail.com', 'a@outlook.com', 'a@hotmail.com', 'a@live.com', 'a@msn.com', 'a@icloud.com', 'a@me.com', 'a@mac.com'])
    assert.equal(emailProviderProblem(e), null, e)
  for (const e of ['a@yahoo.com', 'a@my-company.co.uk', 'a@sub.gmail.com', 'a@gmail.com.evil.com', 'a@notgmail.com'])
    assert.equal(emailProviderProblem(e), PROVIDER_MESSAGE, e)
})

test('ALLOWED_EMAIL_DOMAINS overrides the list, and * allows any domain', () => {
  process.env.ALLOWED_EMAIL_DOMAINS = 'my-company.co.uk, proton.me'
  assert.equal(emailProviderProblem('a@my-company.co.uk'), null)
  assert.equal(emailProviderProblem('a@gmail.com'), PROVIDER_MESSAGE)
  process.env.ALLOWED_EMAIL_DOMAINS = '*'
  assert.equal(emailProviderProblem('a@anything.org'), null)
  delete process.env.ALLOWED_EMAIL_DOMAINS
})
