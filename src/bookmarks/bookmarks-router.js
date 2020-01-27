const path = require('path')
const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const BookmarksService = require('./bookmarks-service')
const xss = require('xss')

const serializeBookmarks = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating)
})

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        
        BookmarksService.getAllBookmarks(req.app.get('db'))
            .then(bookmarks => {
                if(bookmarks.length < 1){
                    return res.status(204).end()
                }
                res.json(bookmarks.map(serializeBookmarks))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, description="" } = req.body;
        const rating = parseInt(req.body.rating)
        const newBookmark = { title, url, description, rating };

        for(const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`${field} value is missing in request.`);

                return res.status(400).json({
                    error: {message: `Must provide '${field}' in request.`}
                })
            }
        }

        if(!/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(newBookmark.url)){
            logger.error('URL is formatted incorrectly.');
            return res.status(400).json({
                error: {message: `URL format is incorrect`}
            });
        }

        if(!Number.isInteger(newBookmark.rating) || newBookmark.rating < 0 || newBookmark.rating > 5) {
            logger.error('Rating is incorrect. It must be a number between 0 and 5');
            return res.status(400).send({
                error: {message: `Rating must be a number between 0 and 5`}
            })
        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
            )
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created`);

                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .json(serializeBookmarks(bookmark));
            })
            .catch(next)
    })

bookmarksRouter
    .route('/:id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.id,
        )
            .then(bookmark => {
                if(!bookmark) {
                    return res.status(404).json({
                        error: {message: `Bookmark doesn't exist`}
                    })
                }
                res.bookmark = bookmark;
                next();
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeBookmarks(res.bookmark))
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.id,
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const { title, url, description } = req.body
        const rating = parseInt(req.body.rating)
        const updateToBookmark = { title, url, description, rating }

        const numberOfValues = Object.values(updateToBookmark).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request must contain at least one value to update`
                }
            })
        }

        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.id,
            updateToBookmark,
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)

    })

module.exports = bookmarksRouter;