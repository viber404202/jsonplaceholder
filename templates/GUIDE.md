# JSONPlaceholder Guide

JSONPlaceholder works with any project that needs to get JSON data — React, Vue, Node, Rails, Swift, Android, and more.

All examples below use the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and can be run directly in your browser's DevTools console.

> **Note:** JSONPlaceholder is a fake API. Create, update, and delete operations are simulated — no data is actually persisted on the server.

---

## Table of Contents

- [Get a resource](#get-a-resource)
- [List all resources](#list-all-resources)
- [Create a resource](#create-a-resource)
- [Update a resource](#update-a-resource)
- [Delete a resource](#delete-a-resource)
- [Filter resources](#filter-resources)
- [Nested resources](#nested-resources)

---

## Get a resource

```js
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => response.json())
  .then(json => console.log(json))
```

**Response:**

```json
{
  "id": 1,
  "title": "...",
  "body": "...",
  "userId": 1
}
```

---

## List all resources

```js
fetch('https://jsonplaceholder.typicode.com/posts')
  .then(response => response.json())
  .then(json => console.log(json))
```

**Response:**

```json
[
  { "id": 1, "title": "..." },
  { "id": 2, "title": "..." },
  ...
  { "id": 100, "title": "..." }
]
```

---

## Create a resource

```js
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  body: JSON.stringify({
    title: 'foo',
    body: 'bar',
    userId: 1,
  }),
})
  .then(response => response.json())
  .then(json => console.log(json))
```

**Response:**

```json
{
  "id": 101,
  "title": "foo",
  "body": "bar",
  "userId": 1
}
```

> The returned `id` is simulated. Fetching `/posts/101` afterwards will return a 404.

---

## Update a resource

### Full update with PUT

Replaces the entire resource.

```js
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  body: JSON.stringify({
    id: 1,
    title: 'foo',
    body: 'bar',
    userId: 1,
  }),
})
  .then(response => response.json())
  .then(json => console.log(json))
```

**Response:**

```json
{
  "id": 1,
  "title": "foo",
  "body": "bar",
  "userId": 1
}
```

### Partial update with PATCH

Updates only the fields you provide.

```js
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  body: JSON.stringify({
    title: 'foo',
  }),
})
  .then(response => response.json())
  .then(json => console.log(json))
```

**Response:**

```json
{
  "id": 1,
  "title": "foo",
  "body": "...",
  "userId": 1
}
```

---

## Delete a resource

```js
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'DELETE',
})
```

Returns an empty object `{}` with status `200` on success.

---

## Filter resources

Filter results by passing query parameters that match resource fields.

```js
// Returns all posts by user 1
fetch('https://jsonplaceholder.typicode.com/posts?userId=1')
  .then(response => response.json())
  .then(json => console.log(json))
```

---

## Nested resources

One level of nesting is supported and is equivalent to filtering by the parent resource's ID.

```js
// Equivalent to: /comments?postId=1
fetch('https://jsonplaceholder.typicode.com/posts/1/comments')
  .then(response => response.json())
  .then(json => console.log(json))
```

**Available nested routes:**

| Route | Equivalent filter |
|-------|-------------------|
| `/posts/1/comments` | `/comments?postId=1` |
| `/albums/1/photos` | `/photos?albumId=1` |
| `/users/1/albums` | `/albums?userId=1` |
| `/users/1/todos` | `/todos?userId=1` |
| `/users/1/posts` | `/posts?userId=1` |
