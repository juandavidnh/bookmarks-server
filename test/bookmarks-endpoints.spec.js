const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmark.fixtures')

describe('Bookmarks endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from database', () => db.destroy())

    before('clean table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe('GET /bookmarks', () => {
        context('Given there are bookmarks in database', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 and all bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(200, testBookmarks)
            })
        })

        context('Given there are no bookmarks in database', () => {
            it('responds with an empty array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(204)
            })
        })
    })

    

    describe('GET /bookmarks/:bookmarkId', () => {
        context('Given there exists bookmark with bookmarkId', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db 
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 with the specified article', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]

                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(200, expectedBookmark)
            })
        })

        context('Given bookmark doesn\'t exist', () => {
            it('responds 404', () => {
                const bookmarkId =12324
                
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer a007017d-864a-4653-b1a0-0c71680ba0e9')
                    .expect(404, {error: {message: `Bookmark doesn't exist`}})
            })
        })
    })
})