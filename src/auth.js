// Fake authentication flow for JSONPlaceholder.
//
// This is NOT real auth — it exists so tutorials can demo login / register /
// protected-route patterns. It issues a *stub JWT*: a genuine, decodable
// JSON Web Token (header.payload.signature) signed with a hard-coded secret.
// The payload is readable by any JWT library, and /profile verifies it, but
// the secret is public so it provides no actual security.
const crypto = require('crypto')
const data = require('../data.json')

const SECRET = 'jsonplaceholder-fake-secret'
const TOKEN_TTL = 3600 // seconds

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function signature(headerAndPayload) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(headerAndPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

// Create a stub JWT for the given user.
function sign(user) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      iat: now,
      exp: now + TOKEN_TTL
    })
  )
  return `${header}.${payload}.${signature(header + '.' + payload)}`
}

// Verify a stub JWT and return its payload, or null if invalid/expired.
function verify(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, sig] = parts
  if (sig !== signature(header + '.' + payload)) return null
  try {
    const claims = JSON.parse(base64urlDecode(payload))
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null
    return claims
  } catch (e) {
    return null
  }
}

function bearer(req) {
  const header = req.get('Authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

// POST /login — { email, password } -> { token, user }
// Any email + password is accepted (it's fake). When the email matches a
// seeded user, that user is returned; otherwise a stub user is synthesized.
function login(req, res) {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).jsonp({ error: 'email and password are required' })
  }
  const known = data.users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  )
  const user = known || {
    id: data.users.length + 1,
    name: String(email).split('@')[0],
    email
  }
  res.jsonp({ token: sign(user), user })
}

// POST /register — { name, email, password } -> { token, user }
function register(req, res) {
  const { name, email, password } = req.body || {}
  if (!name || !email || !password) {
    return res.status(400).jsonp({ error: 'name, email and password are required' })
  }
  const user = { id: data.users.length + 1, name, email }
  res.status(201).jsonp({ token: sign(user), user })
}

// GET /profile — requires `Authorization: Bearer <token>`
function profile(req, res) {
  const claims = verify(bearer(req))
  if (!claims) {
    return res.status(401).jsonp({ error: 'missing or invalid token' })
  }
  res.jsonp({ id: claims.sub, name: claims.name, email: claims.email })
}

module.exports = { sign, verify, login, register, profile }
