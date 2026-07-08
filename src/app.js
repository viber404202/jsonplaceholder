const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

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

// Fake file upload endpoint. Doesn't store anything, just echoes back a
// plausible URL so clients can prototype upload flows.
app.use(jsonServer.bodyParser)
app.post('/uploads', (req, res) => {
  const id = Math.random().toString(36).slice(2, 10)
  const name = (req.body && req.body.name) || 'file'
  res.status(201).jsonp({
    id,
    name,
    url: 'https://jsonplaceholder.typicode.com/uploads/' + id + '/' + name,
    createdAt: new Date().toISOString()
  })
})

app.use(router)

module.exports = app
