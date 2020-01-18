const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks')
    },

    insertBookmark(knex, newArticle) {
        return knex
            .insert(newArticle)
            .into('bookmarks')
            .returning('*')
            .then(rows => {return rows[0]})
    },

    getById(knex, bookmarkId) {
        return knex 
            .from('bookmarks')
            .select('*')
            .where('id', bookmarkId)
            .first()
    },

    updateBookmark(knex, bookmarkId, updatedBookmark) {
        return knex
            .from('bookmarks')
            .where({id: bookmarkId})
            .update(updatedBookmark)
    },

    deleteBookmark(knex, bookmarkId) {
        return knex
            .from('bookmarks')
            .where({id: bookmarkId})
            .delete()
    }
}

module.exports = BookmarksService;