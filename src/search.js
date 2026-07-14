// Rich full-text search middleware for JSONPlaceholder.
//
// json-server's built-in `?q=` is limited: it treats the whole query as a
// single substring and searches every field. This middleware adds:
//
//   * Multi-term search      ?q=lorem ipsum   -> all terms must match (AND)
//   * OR matching            ?q=lorem ipsum&q_op=or
//   * Field-scoped search    ?q=lorem&q_fields=title,body
//   * Case-sensitive search  ?q=Lorem&q_case=1
//
// It keeps json-server's deep-search semantics (nested objects/arrays are
// searched too) and, rather than returning results itself, it rewrites the
// request into an `id` filter and hands off to json-server. That means
// pagination (`_page`/`_limit`), sorting (`_sort`), and relationships
// (`_embed`/`_expand`) all continue to work alongside search.



// A value "matches" a term if the term appears (as a substring) anywhere in
// the value, recursing into objects and arrays.
function valueMatches (value, term, caseSensitive) {
  if (value === null || value === undefined) return false
  if (typeof value === 'object') {
    return Object.values(value).some(v => valueMatches(v, term, caseSensitive))
  }
  const haystack = caseSensitive ? String(value) : String(value).toLowerCase()
  return haystack.indexOf(term) !== -1
}

// A record matches when every term (AND) or any term (OR) is found within the
// searched fields.
function recordMatches (record, terms, fields, op, caseSensitive) {
  const scope = fields
    ? fields.map(field => record[field])
    : Object.values(record)

  const termMatches = term => scope.some(v => valueMatches(v, term, caseSensitive))

  return op === 'or' ? terms.some(termMatches) : terms.every(termMatches)
}

// A collection route looks like `/posts` (single path segment), not
// `/posts/1` (a single resource) or `/` (the home page).
function collectionName (reqPath) {
  const match = reqPath.match(/^\/([^/]+)\/?$/)
  return match ? match[1] : null
}

function search (db) {
  return function searchMiddleware (req, res, next) {
    if (req.method !== 'GET' || !req.query.q) return next()

    const name = collectionName(req.path)
    if (!name) return next()

    const collection = db.get(name).value()
    if (!Array.isArray(collection)) return next()

    // json-server allows repeated params; take the first if q is an array.
    let q = req.query.q
    if (Array.isArray(q)) q = q[0]

    const caseSensitive = ['1', 'true'].indexOf(String(req.query.q_case)) !== -1
    const op = String(req.query.q_op).toLowerCase() === 'or' ? 'or' : 'and'

    const fields = req.query.q_fields
      ? String(req.query.q_fields).split(',').map(f => f.trim()).filter(Boolean)
      : null

    const terms = String(q)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(term => (caseSensitive ? term : term.toLowerCase()))

    // Consume the search params so json-server doesn't re-apply its own `q`.
    delete req.query.q
    delete req.query.q_op
    delete req.query.q_case
    delete req.query.q_fields

    // Empty query (only whitespace) -> no filtering, behave like a plain list.
    if (terms.length === 0) return next()

    let matchedIds = collection
      .filter(record => recordMatches(record, terms, fields, op, caseSensitive))
      .map(record => String(record.id))

    // Respect an existing `id` filter by intersecting with it.
    if (req.query.id !== undefined) {
      const requested = [].concat(req.query.id).map(String)
      matchedIds = matchedIds.filter(id => requested.indexOf(id) !== -1)
    }

    if (matchedIds.length === 0) {
      return res.json([])
    }

    req.query.id = matchedIds

    next()
  }
}

module.exports = search

// Exposed for unit testing.
module.exports._valueMatches = valueMatches
module.exports._recordMatches = recordMatches
module.exports._collectionName = collectionName
