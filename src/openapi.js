const listQueryParams = (filterFields = []) => [
  ...filterFields.map((name) => ({
    name,
    in: 'query',
    schema: { type: 'integer' },
    description: `Filter by ${name}`,
  })),
  { name: '_sort', in: 'query', schema: { type: 'string' }, description: 'Field to sort by' },
  { name: '_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] }, description: 'Sort direction' },
  { name: '_start', in: 'query', schema: { type: 'integer' }, description: 'Slice start index' },
  { name: '_end', in: 'query', schema: { type: 'integer' }, description: 'Slice end index' },
  { name: '_limit', in: 'query', schema: { type: 'integer' }, description: 'Number of items to return' },
  { name: '_page', in: 'query', schema: { type: 'integer' }, description: 'Page number (use with _limit)' },
  { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Full-text search' },
]

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer' },
  description: 'Resource ID',
}

const notFound = {
  description: 'Not found',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
}

const crudPaths = (tag, schemaName, filterFields = []) => ({
  [`/${tag}`]: {
    get: {
      tags: [tag],
      summary: `List all ${tag}`,
      parameters: listQueryParams(filterFields),
      responses: {
        200: {
          description: `Array of ${tag}`,
          headers: {
            'X-Total-Count': { schema: { type: 'integer' }, description: 'Total number of resources' },
          },
          content: { 'application/json': { schema: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } } } },
        },
      },
    },
    post: {
      tags: [tag],
      summary: `Create a ${schemaName}`,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}Input` } } },
      },
      responses: {
        201: {
          description: `${schemaName} created`,
          content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } },
        },
      },
    },
  },
  [`/${tag}/{id}`]: {
    parameters: [idParam],
    get: {
      tags: [tag],
      summary: `Get a ${schemaName} by ID`,
      responses: {
        200: { description: `A ${schemaName}`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
        404: notFound,
      },
    },
    put: {
      tags: [tag],
      summary: `Replace a ${schemaName}`,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}Input` } } },
      },
      responses: {
        200: { description: `${schemaName} replaced`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
        404: notFound,
      },
    },
    patch: {
      tags: [tag],
      summary: `Partially update a ${schemaName}`,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}Input` } } },
      },
      responses: {
        200: { description: `${schemaName} updated`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
        404: notFound,
      },
    },
    delete: {
      tags: [tag],
      summary: `Delete a ${schemaName}`,
      responses: {
        200: { description: `${schemaName} deleted`, content: { 'application/json': { schema: { type: 'object' } } } },
        404: notFound,
      },
    },
  },
})

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'JSONPlaceholder API',
    version: '0.3.3',
    description:
      'Free fake REST API for testing and prototyping.\n\n' +
      'All write operations (POST, PUT, PATCH, DELETE) are **simulated** — ' +
      'the database resets on each request so no data is persisted.\n\n' +
      '**Pagination:** use `_page` + `_limit`. ' +
      'The total item count is returned in the `X-Total-Count` response header.\n\n' +
      '**Filtering:** pass any resource field as a query param, e.g. `GET /posts?userId=1`.\n\n' +
      '**Full-text search:** use the `q` param, e.g. `GET /posts?q=lorem`.',
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },
  servers: [{ url: '/', description: 'Current host' }],
  tags: [
    { name: 'posts', description: 'Blog posts' },
    { name: 'comments', description: 'Post comments' },
    { name: 'albums', description: 'Photo albums' },
    { name: 'photos', description: 'Album photos' },
    { name: 'todos', description: 'Todo items' },
    { name: 'users', description: 'Users' },
  ],
  paths: {
    ...crudPaths('posts', 'Post', ['userId']),
    ...crudPaths('comments', 'Comment', ['postId']),
    ...crudPaths('albums', 'Album', ['userId']),
    ...crudPaths('photos', 'Photo', ['albumId']),
    ...crudPaths('todos', 'Todo', ['userId']),
    ...crudPaths('users', 'User'),

    '/posts/{id}/comments': {
      parameters: [idParam],
      get: {
        tags: ['posts', 'comments'],
        summary: 'List comments for a post',
        parameters: listQueryParams(),
        responses: {
          200: {
            description: 'Array of comments',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Comment' } } } },
          },
          404: notFound,
        },
      },
    },

    '/albums/{id}/photos': {
      parameters: [idParam],
      get: {
        tags: ['albums', 'photos'],
        summary: 'List photos in an album',
        parameters: listQueryParams(),
        responses: {
          200: {
            description: 'Array of photos',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Photo' } } } },
          },
          404: notFound,
        },
      },
    },

    '/users/{id}/albums': {
      parameters: [idParam],
      get: {
        tags: ['users', 'albums'],
        summary: "List a user's albums",
        parameters: listQueryParams(),
        responses: {
          200: {
            description: 'Array of albums',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Album' } } } },
          },
          404: notFound,
        },
      },
    },

    '/users/{id}/todos': {
      parameters: [idParam],
      get: {
        tags: ['users', 'todos'],
        summary: "List a user's todos",
        parameters: listQueryParams(),
        responses: {
          200: {
            description: 'Array of todos',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Todo' } } } },
          },
          404: notFound,
        },
      },
    },

    '/users/{id}/posts': {
      parameters: [idParam],
      get: {
        tags: ['users', 'posts'],
        summary: "List a user's posts",
        parameters: listQueryParams(),
        responses: {
          200: {
            description: 'Array of posts',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Post' } } } },
          },
          404: notFound,
        },
      },
    },
  },
  components: {
    schemas: {
      Post: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'sunt aut facere repellat' },
          body: { type: 'string', example: 'quia et suscipit recusandae consequuntur' },
        },
      },
      PostInput: {
        type: 'object',
        required: ['userId', 'title', 'body'],
        properties: {
          userId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'My new post' },
          body: { type: 'string', example: 'Post content goes here.' },
        },
      },

      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          postId: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'id labore ex et quam laborum' },
          email: { type: 'string', format: 'email', example: 'Eliseo@gardner.biz' },
          body: { type: 'string', example: 'laudantium enim quasi est quidem' },
        },
      },
      CommentInput: {
        type: 'object',
        required: ['postId', 'name', 'email', 'body'],
        properties: {
          postId: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Great post!' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          body: { type: 'string', example: 'This is my comment.' },
        },
      },

      Album: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'quidem molestiae enim' },
        },
      },
      AlbumInput: {
        type: 'object',
        required: ['userId', 'title'],
        properties: {
          userId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'My vacation photos' },
        },
      },

      Photo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          albumId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'accusamus beatae ad facilis' },
          url: { type: 'string', format: 'uri', example: 'https://via.placeholder.com/600/92c952' },
          thumbnailUrl: { type: 'string', format: 'uri', example: 'https://via.placeholder.com/150/92c952' },
        },
      },
      PhotoInput: {
        type: 'object',
        required: ['albumId', 'title', 'url', 'thumbnailUrl'],
        properties: {
          albumId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Sunset at the beach' },
          url: { type: 'string', format: 'uri', example: 'https://via.placeholder.com/600/abc123' },
          thumbnailUrl: { type: 'string', format: 'uri', example: 'https://via.placeholder.com/150/abc123' },
        },
      },

      Todo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'delectus aut autem' },
          completed: { type: 'boolean', example: false },
        },
      },
      TodoInput: {
        type: 'object',
        required: ['userId', 'title', 'completed'],
        properties: {
          userId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Buy groceries' },
          completed: { type: 'boolean', example: false },
        },
      },

      Geo: {
        type: 'object',
        properties: {
          lat: { type: 'string', example: '-37.3159' },
          lng: { type: 'string', example: '81.1496' },
        },
      },
      Address: {
        type: 'object',
        properties: {
          street: { type: 'string', example: 'Kulas Light' },
          suite: { type: 'string', example: 'Apt. 556' },
          city: { type: 'string', example: 'Gwenborough' },
          zipcode: { type: 'string', example: '92998-3874' },
          geo: { $ref: '#/components/schemas/Geo' },
        },
      },
      Company: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Romaguera-Crona' },
          catchPhrase: { type: 'string', example: 'Multi-layered client-server neural-net' },
          bs: { type: 'string', example: 'harness real-time e-markets' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Leanne Graham' },
          username: { type: 'string', example: 'Bret' },
          email: { type: 'string', format: 'email', example: 'Sincere@april.biz' },
          address: { $ref: '#/components/schemas/Address' },
          phone: { type: 'string', example: '1-770-736-8031 x56442' },
          website: { type: 'string', example: 'hildegard.org' },
          company: { $ref: '#/components/schemas/Company' },
        },
      },
      UserInput: {
        type: 'object',
        required: ['name', 'username', 'email'],
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          username: { type: 'string', example: 'janedoe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          address: { $ref: '#/components/schemas/Address' },
          phone: { type: 'string', example: '555-0100' },
          website: { type: 'string', example: 'janedoe.dev' },
          company: { $ref: '#/components/schemas/Company' },
        },
      },

      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Not found' },
        },
      },
    },
  },
}
