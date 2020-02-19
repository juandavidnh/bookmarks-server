const BookmarksService = require('../src/bookmarks/bookmarks-service')
const knex = require('knex')
const { makeBookmarksArray } = require('./bookmark.fixtures')

describe(`BookmarksService object`, function() {
    let db
    let testBookmarks = makeBookmarksArray()

    before(() => {
        db = knex({
        client: 'pg',
        connection: process.env.TEST_DATABASE_URL,
        })
    })

    before(() => db('bookmarks').truncate())

    afterEach(() => db('bookmarks').truncate())

    after(() => db.destroy())

    context(`Given bookmarks has data`, () => {
        beforeEach(() => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })

        it(`getAllBookmarks() should show all bookmarks in bookmarks table`, () => {
            return BookmarksService.getAllBookmarks(db)
                .then(actual => {
                    expect(actual).to.eql(testBookmarks)
                })
        })

        it('getById() should return bookmark by id from bookmarks table', () => {
            const idOfBookmark = 2
            const bookmarkOfId = testBookmarks[idOfBookmark - 1]

            return BookmarksService.getById(db, idOfBookmark)
                .then(actual => 
                    expect(actual).to.eql({
                        id: idOfBookmark,
                        title: bookmarkOfId.title,
                        url: bookmarkOfId.url,
                        description: bookmarkOfId.description,
                        rating: bookmarkOfId.rating,
                }))
        })

        it('updateBookmark() should update article from bookmarks table', () => {
            const idOfBookmark = 3
            const updatedBookmark = {
                title: "New Website",
                url: "https://help.com",
                description: "My new description",
                rating: 1,
            }

            return BookmarksService.updateBookmark(db, idOfBookmark, updatedBookmark)
                .then(() => BookmarksService.getById(db, idOfBookmark))
                .then(actual => {
                    expect(actual).to.eql({
                        id: idOfBookmark,
                        title: updatedBookmark.title,
                        url: updatedBookmark.url,
                        description: updatedBookmark.description,
                        rating: updatedBookmark.rating,
                    })
                })
        })

        it('deleteBookmark() should remove article from bookmarks', () => {
            const idOfBookmark = 2

            return BookmarksService.deleteBookmark(db, idOfBookmark)
                .then(() => BookmarksService.getAllBookmarks(db))
                .then(newArray => {
                    const expected = testBookmarks.filter(bookmark => bookmark.id !== idOfBookmark)
                    expect(newArray).to.eql(expected)
                })
        })
    })

    context(`Given bookmarks is empty`, () => {
        it('getAllBookmarks() resolves to an empty array.', () => {
            return BookmarksService.getAllBookmarks(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })

        it('insertBookmark() resolves to array with only the inserted bookmark', () => {
            const newBookmark = {
                title: "Instagram",
                url: "https://instagram.com",
                description: "For those who love filters",
                rating: 3,
            }

            return BookmarksService.insertBookmark(db, newBookmark)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        title: newBookmark.title,
                        url: newBookmark.url,
                        description: newBookmark.description,
                        rating: newBookmark.rating,
                    })
                })
        })
    })
})