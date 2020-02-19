const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray, makeMaliciousArray } = require('./bookmark.fixtures')

describe('Bookmarks endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from database', () => db.destroy())

    before('clean table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe('GET /api/bookmarks', () => {
        context('Given there are bookmarks in database', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 and all bookmarks', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(200, testBookmarks)
            })
        })

        context('Given there are no bookmarks in database', () => {
            it('responds with an empty array', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(204)
            })
        })

        context('A malicious xss is requested', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousArray();

            beforeEach('insert bookmarks', () => {
                return db 
                    .into('bookmarks')
                    .insert([maliciousBookmark])
            })

            it('returns sanitized bookmark', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    describe('POST /api/bookmarks', () => {
        it('creates a bookmark, responding with a 201 status and the new bookmark', () => {
            this.retries(3)
            const newBookmark = {
                title: 'New Bookmark',
                url: 'https://wordpress.com',
                description: 'New bookmark description....',
                rating: 5,
            }

            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                })
                .then(res => {
                    supertest(app)
                        .get(`/api/bookmarks/${res.body.id}`)
                        .expect(res.body)
                })
        })

        const requiredFields = ['title', 'url', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'New Bookmark',
                url: 'https://xm.com',
                rating: 5,
            } 

            it(`responds with a 400 error when missing ${field}`, () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .send(newBookmark)
                    .expect(400, {
                        error: {message: `Must provide '${field}' in request.`}
                    })
            })
        })

        it('responds with 404 when url isn\'t formatted correctly', () => {
            const newBookmark = {
                title: 'New Bookmark',
                url: 'https://xm',
                rating: 5,
            } 

            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                .send(newBookmark)
                .expect(400,{
                    error: {message: `URL format is incorrect`}
                })
        })

        it('responds with 404 when rating is incorrect', () => {
            const newBookmark = {
                title: 'New Bookmark',
                url: 'https://xm.com',
                rating: 90,
            } 

            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                .send(newBookmark)
                .expect(400,{
                    error: {message: `Rating must be a number between 0 and 5`}
                })
        })

        it('responds with sanitized bookmark', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousArray();

            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                .send(maliciousBookmark)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title)
                    expect(res.body.description).to.eql(expectedBookmark.description)
                })
        })
    })

    

    describe('GET /api/bookmarks/:bookmarkId', () => {
        context('Given there exists bookmark with bookmarkId', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db 
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 with the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]

                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(200, expectedBookmark)
            })
        })

        context('Given bookmark doesn\'t exist', () => {
            it('responds 404', () => {
                const bookmarkId =12324
                
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(404, {error: {message: `Bookmark doesn't exist`}})
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousArray()
      
            beforeEach('insert malicious bookmark', () => {
              return db
                .into('bookmarks')
                .insert([maliciousBookmark])
            })
      
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/api/bookmarks/${maliciousBookmark.id}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                  expect(res.body.title).to.eql(expectedBookmark.title)
                  expect(res.body.description).to.eql(expectedBookmark.description)
                })
            })
          })

    })

    describe('DELETE /api/bookmarks/:id', () => {
        context('Given the bookmark exists', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db 
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 204 and removes bookmark', () => {
                const idOfBookmark = 2;
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id != idOfBookmark)
                return supertest(app)
                    .delete(`/api/bookmarks/${idOfBookmark}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get('/api/bookmarks')
                            .expect(expectedBookmarks)
                    })
            })
        })

        context('Given bookmark doesn\'t exist', () => {
            it('responds with 404', () => {
                const bookmarkId = 28391;
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(404, { error: { message: `Bookmark doesn't exist`} })
            })
        })       
    })

    describe(`PATCH /api/bookmarks/:id`, () => {
        context('Given no bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkId = 234567
                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db   
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 204 and an updated bookmark', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'Updated Bookmark',
                    url: 'https://bestbuy.com',
                    rating: 2       
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark,
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .send({...updateBookmark})
                    .expect(204)
                    .then( res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                            .expect(expectedBookmark)
                        )
            })

            it('responds with 400 when no values are supplied for any fields', () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .send({ fieldToIgnore: 'foo' })
                    .expect(400, {
                        error: {
                            message: 'Request must contain at least one value to update'
                        }
                    })
            })

            it('returns 204 and updates when provided with a subset of values', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: "My Power Bookmark"
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .send({...updateBookmark})
                    .expect(204)
                    .then( res =>
                        supertest(app)
                        .get(`/api/bookmarks/${idToUpdate}`)
                        .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                        .expect(expectedBookmark)
                    )
            })
        })
    })
}) 