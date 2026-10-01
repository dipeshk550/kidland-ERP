const jwt = require('jsonwebtoken')
const { User, Role } = require('../models/index')
exports.protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : req.cookies?.token
    if (!token) return res.status(401).json({ message: 'Not authorised' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password').populate('customRole')
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or inactive' })
    if (decoded.tokenVersion !== (user.tokenVersion || 0)) return res.status(401).json({ message: 'Session expired' })
    req.user = user; next()
  } catch { res.status(401).json({ message: 'Token invalid or expired' }) }
}
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
  next()
}
exports.adminOnly = exports.restrictTo('superadmin','admin','coadmin')
exports.superAdminOnly = exports.restrictTo('superadmin')

const ACTIONS = ['view','create','edit','delete','approve','export']
const methodAction = method => ({ GET: 'view', POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete' }[method] || 'view')
const hasPermission = (user, module, action) => {
  if (!user) return false
  if (['superadmin','admin'].includes(user.role)) return true
  const override = (user.permissionOverrides || []).find(p => p.module === module && p.action === action)
  if (override) return override.allowed
  // Existing coadmins historically had access to all admin modules. An
  // assigned custom role opts into its explicit matrix; absent that, inherit.
  if (user.role === 'coadmin' && !user.customRole) return !['roles','audit'].includes(module)
  // These were existing role capabilities before granular RBAC was introduced.
  if (user.role === 'teacher' && !user.customRole && module === 'lms') return true
  if (user.role === 'staff' && !user.customRole && ['library','transport','fees'].includes(module)) return true
  const entry = user.customRole && user.customRole.isActive !== false &&
    (user.customRole.permissions || []).find(p => p.module === module)
  return !!(entry && entry.actions.includes(action))
}
exports.hasPermission = hasPermission
exports.authorize = (module, action) => (req, res, next) => {
  action = action || methodAction(req.method)
  if (!ACTIONS.includes(action) || !hasPermission(req.user, module, action))
    return res.status(403).json({ message: `Permission denied: ${module}.${action}` })
  next()
}
