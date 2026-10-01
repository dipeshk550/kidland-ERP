const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mail = require('../services/mailService')
const { User, AuditLog } = require('../models/index')
const sign = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN||'7d' })
const co = { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'strict', maxAge:7*24*60*60*1000 }
exports.login = async (req, res) => {
  try {
    const { identifier, email, password, rememberMe } = req.body
    const loginId = String(identifier || email || '').trim()
    if (!loginId || !password) return res.status(400).json({ message: 'Login ID and password are required' })
    const normalized = loginId.toLowerCase()
    const user = await User.findOne({
      $or: [
        { email: normalized },
        { username: normalized },
        { employeeId: loginId.toUpperCase() },
        { parentId: loginId.toUpperCase() },
        { phone: loginId },
      ],
    }).select('+password')
    if (!user||!(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password' })
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' })
    await user.populate('customRole')
    user.lastLogin = new Date(); await user.save({ validateBeforeSave: false })
    await AuditLog.create({ actor: user._id, action: 'login', entity: 'user', entityId: user._id })
    const token = jwt.sign({ id: user._id, tokenVersion: user.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: rememberMe === false ? '12h' : (process.env.JWT_EXPIRES_IN || '7d') })
    res.cookie('token', token, co)
    res.json({ token, data: { user: { id:user._id, name:user.name, email:user.email, role:user.role, avatar:user.avatar, customRole:user.customRole, permissionOverrides:user.permissionOverrides } } })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.getMe = (req, res) => res.json({ data: { user: req.user } })
exports.logout = async (req, res) => {
  const user = await User.findById(req.user._id)
  if (user) { user.tokenVersion = (user.tokenVersion || 0) + 1; await user.save({ validateBeforeSave: false }) }
  await AuditLog.create({ actor: req.user._id, action: 'logout', entity: 'user', entityId: req.user._id })
  res.clearCookie('token'); res.json({ message: 'Logged out' })
}
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    if (!user || typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8)
      return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required' })
    if (!(await user.comparePassword(currentPassword))) return res.status(400).json({ message: 'Current password incorrect' })
    user.password = newPassword; user.tokenVersion = (user.tokenVersion || 0) + 1; await user.save()
    res.json({ message: 'Password updated' })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.requestPasswordReset = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim()
    if (!identifier) return res.status(400).json({ message: 'Email, phone, username, or account ID is required' })
    const normalized = identifier.toLowerCase()
    const user = await User.findOne({ $or: [{ email: normalized }, { username: normalized }, { phone: identifier }, { employeeId: identifier.toUpperCase() }, { parentId: identifier.toUpperCase() }] })
    const response = { message: 'If an active account matches, password reset instructions have been issued.' }
    if (!user || !user.isActive) return res.json(response)
    const rawToken = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000)
    await user.save({ validateBeforeSave: false })
    await AuditLog.create({ actor: user._id, action: 'password-reset-request', entity: 'user', entityId: user._id })
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${encodeURIComponent(rawToken)}`
    try {
      await mail.sendPasswordReset({ to: user.email, name: user.name, resetUrl })
    } catch (mailError) {
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save({ validateBeforeSave: false })
      return res.status(503).json({ message: 'Password reset is temporarily unavailable. Please contact the school administrator.' })
    }
    return res.json(response)
  } catch (err) { return res.status(500).json({ message: 'Unable to process password reset request' }) }
}
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword || newPassword.length < 8) return res.status(400).json({ message: 'A valid token and password of at least 8 characters are required' })
    const hash = crypto.createHash('sha256').update(String(token)).digest('hex')
    const user = await User.findOne({ passwordResetToken: hash, passwordResetExpires: { $gt: new Date() } })
      .select('+password +passwordResetToken +passwordResetExpires')
    if (!user) return res.status(400).json({ message: 'Reset token is invalid or expired' })
    user.password = newPassword
    user.tokenVersion = (user.tokenVersion || 0) + 1
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    await AuditLog.create({ actor: user._id, action: 'password-reset', entity: 'user', entityId: user._id })
    return res.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (err) { return res.status(500).json({ message: 'Unable to reset password' }) }
}
