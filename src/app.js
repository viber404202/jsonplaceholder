const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')
const auth = require('./auth')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

app.use((req, res, next) => {
  if (req.path === '/') return next()
  router.db.setState(clone(data))
  next()
})

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}))

// Fake auth flow — stub JWTs for demoing protected routes (see src/auth.js)
app.use(jsonServer.bodyParser)
app.post('/login', auth.login)
app.post('/register', auth.register)
app.get('/profile', auth.profile)

app.use(router)

module.exports = app
