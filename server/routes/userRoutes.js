const r = require('express').Router()
const c = require('../controllers/userController')
const { protect, adminOnly, authorize } = require('../middleware/authMiddleware')

// Self-service profile routes are available to every authenticated account.
// The controller only updates the current user's own record.
r.put('/profile/me',       protect, c.updateProfile)
r.put('/profile/password', protect, c.changePassword)

// Admin CRUD; controller prevents non-superadmins from touching Super Admin.
r.get('/',      protect, adminOnly, authorize('roles','view'), c.getAllUsers)
r.post('/',     protect, adminOnly, authorize('roles','create'), c.createUser)
r.put('/:id',   protect, adminOnly, authorize('roles','edit'), c.updateUser)
r.put('/:id/password', protect, adminOnly, authorize('roles','edit'), c.resetUserPassword)
r.delete('/:id',protect, adminOnly, authorize('roles','delete'), c.deleteUser)

module.exports = r
