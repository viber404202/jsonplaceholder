const test = require('tape')
const request = require('supertest')
const app = require('../src/app')
const data = require('../data.json')

// Pull two distinct "search-friendly" words out of a string.
function wordsOf (str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
}

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('POST /', (t) => {
  const max = 10
  t.plan(max * 3)

  // Test concurrency
  for (var i = 0; i < max; i++) {
    request(app)
      .post('/posts')
      .send({ body: 'foo' })
      .expect(201, (err) => {
        t.error(err)
        // Check that GET /posts length still returns 100 items
        request(app)
          .get('/posts')
          .expect(200, (err, res) => {
            t.error(err)
            const { length } = res.body
            t.equal(
              length,
              100,
              `more than 100 posts found (${length})`
            )
          })
      })
  }
})

test('GET /posts?q= multi-term (AND) matches records containing every term', (t) => {
  const post = data.posts[0]
  const words = wordsOf(post.title)
  const [a, b] = words
  t.ok(a && b, 'test fixture has at least two searchable words')
  if (!a || !b) return t.end()

  request(app)
    .get(`/posts?q=${encodeURIComponent(a + ' ' + b)}`)
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.length > 0, 'returns at least one match')
      const allMatch = res.body.every((p) => {
        const hay = JSON.stringify(p).toLowerCase()
        return hay.includes(a) && hay.includes(b)
      })
      t.ok(allMatch, 'every result contains all terms')
      t.ok(res.body.some((p) => p.id === post.id), 'includes the source post')
      t.end()
    })
})

test('GET /posts?q= with OR returns a superset of AND', (t) => {
  const post = data.posts[0]
  const [a, b] = wordsOf(post.title)
  if (!a || !b) {
    t.ok(false, 'test fixture has at least two searchable words')
    return t.end()
  }
  const query = encodeURIComponent(a + ' ' + b)

  request(app)
    .get(`/posts?q=${query}`)
    .expect(200, (err, andRes) => {
      t.error(err)
      request(app)
        .get(`/posts?q=${query}&q_op=or`)
        .expect(200, (err, orRes) => {
          t.error(err)
          t.ok(orRes.body.length >= andRes.body.length, 'OR >= AND result count')
          t.end()
        })
    })
})

test('GET /posts?q= with q_fields scopes the search to given fields', (t) => {
  // Find a post whose title has a word that does NOT appear in its body.
  const target = data.posts.find((p) => {
    const bodyWords = new Set(wordsOf(p.body))
    return wordsOf(p.title).some((w) => !bodyWords.has(w))
  })
  if (!target) {
    t.skip('no fixture post has a title-only word')
    return t.end()
  }
  const word = wordsOf(target.title).find(
    (w) => !new Set(wordsOf(target.body)).has(w)
  )

  request(app)
    .get(`/posts?q=${encodeURIComponent(word)}&q_fields=body`)
    .expect(200, (err, res) => {
      t.error(err)
      const found = res.body.some((p) => p.id === target.id)
      t.notOk(found, 'title-only word is excluded when scoped to body')
      t.end()
    })
})

test('GET /posts?q= composes with pagination (_limit)', (t) => {
  request(app)
    .get('/posts?q=a&_limit=3')
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.length <= 3, 'respects _limit alongside search')
      t.ok(res.headers['x-total-count'] !== undefined, 'sets X-Total-Count')
      t.end()
    })
})

test('GET /posts?q= with no matches returns an empty array', (t) => {
  request(app)
    .get('/posts?q=zzzzxxxxqqqqnotarealword')
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(Array.isArray(res.body), 'returns an array')
      t.equal(res.body.length, 0, 'no matches')
      t.end()
    })
})

test('GET /users?q= searches nested objects (deep)', (t) => {
  const user = data.users[0]
  const city = user.address && user.address.city
  t.ok(city, 'fixture user has a nested address.city')

  request(app)
    .get(`/users?q=${encodeURIComponent(city.toLowerCase())}`)
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.some((u) => u.id === user.id), 'matches on nested field')
      t.end()
    })
})
