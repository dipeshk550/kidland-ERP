const router = require('express').Router()
const { protect } = require('../middleware/authMiddleware')
const c = require('../controllers/notificationController')
router.use(protect)
router.get('/', c.list)
router.put('/:id/read', c.read)
module.exports = router
