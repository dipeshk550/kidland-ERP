const router = require('express').Router()
const { protect, authorize } = require('../middleware/authMiddleware')
const l = require('../controllers/libraryController')

router.use(protect, authorize('library'))

// Book Categories
router.route('/categories').get(l.listCategories).post(l.createCategory)
router.route('/categories/:id').put(l.updateCategory).delete(l.deleteCategory)

// Authors
router.route('/authors').get(l.listAuthors).post(l.createAuthor)
router.route('/authors/:id').put(l.updateAuthor).delete(l.deleteAuthor)

// Publishers
router.route('/publishers').get(l.listPublishers).post(l.createPublisher)
router.route('/publishers/:id').put(l.updatePublisher).delete(l.deletePublisher)

// Books
router.route('/books').get(l.listBooks).post(l.createBook)
router.route('/books/:id').put(l.updateBook).delete(l.deleteBook)

// Issues
router.route('/issues').get(l.listIssues).post(l.issueBook)
router.route('/issues/:id').get(l.getIssue)
router.put('/issues/:id/return', l.returnBook)
router.put('/issues/:id/renew',  l.renewBook)

// Fines
router.route('/fines').get(l.listFines)
router.put('/fines/:id/collect', l.collectFine)
router.put('/fines/:id/waive',   l.waiveFine)

// Reports
router.get('/reports/summary', l.getLibraryReports)
router.get('/reports/overdue', l.getOverdueBooks)

module.exports = router
