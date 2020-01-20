function makeBookmarksArray() {
    return [
            {
                "id": 1,
                "title": "Thinkful",
                "url": "https://www.thinkful.com",
                "description": "Think outside the classroom",
                "rating": 5
            },
            {
                "id": 2,
                "title": "Google",
                "url": "https://www.google.com",
                "description": "Where we find everything else",
                "rating": 4
            },
            {
                "id": 3,
                 "title": "MDN",
                "url": "https://developer.mozilla.org",
                "description": "The only place to find web documentation",
                "rating": 5
            }
    ]
}

function makeMaliciousArray() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty <script>alert("xss");</script>',
        url: 'https://reference.com',
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        rating: 4,
    }

    const expectedBookmark = {
        id: 911,
        title: 'Naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        url: 'https://reference.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        rating: 4,
    }

    return {
        maliciousBookmark,
        expectedBookmark,
    }
}

module.exports = { 
    makeBookmarksArray,
    makeMaliciousArray,
 };