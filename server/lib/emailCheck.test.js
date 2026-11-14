import test from 'node:test'
import assert from 'node:assert/strict'
import { emailFormatProblem } from './emailCheck.js'

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
