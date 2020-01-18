const app = require('../src/app')

describe('App', () => {
  it('GET / responds with 200 containing "Hello, boilerplate!"', () => {
    return supertest(app)
      .get('/')
      .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
      .expect(200, 'Hello, boilerplate!')
  })
})