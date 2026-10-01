const { User, Course, ParentStudent, Enrollment, Notification, Submission, QuizAttempt, AuditLog } = require('../models/index')
const bcrypt = require('bcryptjs')

exports.getAllUsers = async (req, res) => {
  try { res.json({ data: await User.find().select('-password').sort('-createdAt') }) }
  catch (err) { res.status(500).json({ message: err.message }) }
}

exports.createUser = async (req, res) => {
  try {
    const { status, ...body } = req.body
    if (req.user.role !== 'superadmin' && body.role === 'superadmin')
      return res.status(403).json({ message: 'Only Super Admin can create a Super Admin' })
    const u = await User.create({ ...body, ...(status !== undefined ? { isActive: status === 'active' } : {}) })
    res.status(201).json({ message: 'User created', data: { id: u._id, name: u.name, email: u.email, role: u.role } })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

exports.updateUser = async (req, res) => {
  try {
    const existing = await User.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Not found' })
    if (req.user.role !== 'superadmin' && (existing.role === 'superadmin' || req.body.role === 'superadmin'))
      return res.status(403).json({ message: 'Only Super Admin can modify Super Admin accounts' })
    const { password, status, ...rest } = req.body
    if (status !== undefined) rest.isActive = status === 'active'
    const u = await User.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true }).select('-password')
    await AuditLog.create({ actor: req.user._id, action: 'edit', entity: 'user', entityId: u._id, details: { role: rest.role, isActive: rest.isActive }, ip: req.ip })
    res.json({ message: 'Updated', data: u })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

exports.deleteUser = async (req, res) => {
  try {
    const u = await User.findById(req.params.id)
    if (!u) return res.status(404).json({ message: 'Not found' })
    if (u.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete Super Admin' })
    const ownedCourses = await Course.countDocuments({ $or: [{ instructor: u._id }, { createdBy: u._id }] })
    if (ownedCourses) return res.status(409).json({ message: 'Cannot delete a user with LMS courses. Reassign or archive the courses first.' })
    await u.deleteOne()
    await Promise.all([
      ParentStudent.deleteMany({ $or: [{ parent: u._id }, { student: u._id }] }),
      Enrollment.deleteMany({ student: u._id }),
      Notification.deleteMany({ recipient: u._id }),
      Submission.deleteMany({ student: u._id }),
      QuizAttempt.deleteMany({ student: u._id }),
    ])
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

// PUT /api/users/profile/me — update own name + avatar (any logged-in admin)
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body
    const update = {}
    if (name)   update.name   = name
    if (avatar !== undefined) update.avatar = avatar
    const u = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select('-password')
    if (!u) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'Profile updated', data: u })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// PUT /api/users/profile/password — change own password (any logged-in admin)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required' })
    if (typeof newPassword !== 'string' || newPassword.length < 8)
      return res.status(400).json({ message: 'New password must be at least 8 characters' })

    const u = await User.findById(req.user._id).select('+password')
    if (!u) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(currentPassword, u.password)
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' })

    u.password = newPassword   // pre-save hook will hash it
    u.tokenVersion = (u.tokenVersion || 0) + 1
    await u.save()
    res.json({ message: 'Password changed successfully' })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

// Admin-set password: the new password is never returned or written to audit logs.
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    if (typeof newPassword !== 'string' || newPassword.length < 8)
      return res.status(400).json({ message: 'New password must be at least 8 characters' })

    const user = await User.findById(req.params.id).select('+password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'superadmin' && req.user.role !== 'superadmin')
      return res.status(403).json({ message: 'Only Super Admin can reset a Super Admin password' })

    user.password = newPassword
    user.tokenVersion = (user.tokenVersion || 0) + 1
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    await AuditLog.create({
      actor: req.user._id,
      action: 'admin-password-reset',
      entity: 'user',
      entityId: user._id,
      ip: req.ip,
    })
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    res.status(400).json({ message: err.message || 'Unable to reset password' })
  }
}
