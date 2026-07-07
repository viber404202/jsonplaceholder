const data = require('../data.json')

// Pick a random element from an array.
function sample(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// Build a simulated real-time event referencing real records from data.json.
// This lets clients test live-updating UIs without a real backend.
function makeEvent() {
  const type = sample([
    'comment.created',
    'post.created',
    'todo.completed',
    'photo.added',
    'user.online',
  ])

  switch (type) {
    case 'comment.created': {
      const comment = sample(data.comments)
      return { type, resource: 'comments', data: comment }
    }
    case 'post.created': {
      const post = sample(data.posts)
      return { type, resource: 'posts', data: post }
    }
    case 'todo.completed': {
      const todo = sample(data.todos)
      return { type, resource: 'todos', data: { ...todo, completed: true } }
    }
    case 'photo.added': {
      const photo = sample(data.photos)
      return { type, resource: 'photos', data: photo }
    }
    case 'user.online':
    default: {
      const user = sample(data.users)
      return {
        type: 'user.online',
        resource: 'users',
        data: { id: user.id, name: user.name, username: user.username },
      }
    }
  }
}

// Server-Sent Events endpoint that pushes a simulated event on an interval.
// Query params:
//   ?interval=<ms>   delay between events (default 3000, clamped to 250..60000)
//   ?type=<type>     only emit events of this type
function handler(req, res) {
  const parsed = parseInt(req.query.interval, 10)
  const interval = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 250), 60000)
    : 3000
  const only = req.query.type

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  // Prompt the client's EventSource to reconnect after 2s if the stream drops.
  res.write('retry: 2000\n\n')

  let id = 0
  const timer = setInterval(() => {
    let event = makeEvent()
    // If a type filter is set, keep drawing until it matches.
    if (only) {
      let tries = 0
      while (event.type !== only && tries < 20) {
        event = makeEvent()
        tries++
      }
      if (event.type !== only) return
    }

    id++
    res.write(`id: ${id}\n`)
    res.write(`event: ${event.type}\n`)
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }, interval)

  req.on('close', () => clearInterval(timer))
}

module.exports = { handler, makeEvent }
