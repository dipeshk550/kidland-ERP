const { Role, User, AuditLog } = require('../models')

const modules = ['dashboard','news','events','gallery','notices','teachers','alumni','results','admissions','contacts','whatsapp','fees','library','transport','lms','attendance','relationships','settings','users','roles','audit']
const actions = ['view','create','edit','delete','approve','export']
const writeAudit = (req, action, entity, entityId, details) =>
  AuditLog.create({ actor: req.user._id, action, entity, entityId, details, ip: req.ip })

exports.catalog = (req, res) => res.json({ data: modules.map(module => ({ module, actions })) })
exports.listRoles = async (req, res) => res.json({ data: await Role.find().sort('name').populate('createdBy','name email') })
exports.createRole = async (req, res) => {
  try {
    const { name, label, description, permissions = [] } = req.body
    if (!name || !label) return res.status(400).json({ message: 'Role name and label are required' })
    const clean = permissions.map(p => ({
      module: String(p.module || '').trim(),
      actions: [...new Set((p.actions || []).filter(a => actions.includes(a)))],
    })).filter(p => modules.includes(p.module))
    const role = await Role.create({ name, label, description, permissions: clean, createdBy: req.user._id })
    await writeAudit(req, 'create', 'role', role._id, { name: role.name })
    res.status(201).json({ data: role })
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Role already exists' : e.message }) }
}
exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
    if (!role) return res.status(404).json({ message: 'Role not found' })
    if (role.isSystem && req.body.name && req.body.name !== role.name) return res.status(400).json({ message: 'System role cannot be renamed' })
    const allowed = ['label','description','isActive','permissions']
    allowed.forEach(k => { if (req.body[k] !== undefined) role[k] = req.body[k] })
    if (role.permissions) role.permissions = role.permissions
      .filter(p => modules.includes(p.module))
      .map(p => ({ module: p.module, actions: [...new Set((p.actions || []).filter(a => actions.includes(a)))] }))
    await role.save(); await writeAudit(req, 'edit', 'role', role._id, { changes: req.body })
    res.json({ data: role })
  } catch (e) { res.status(400).json({ message: e.message }) }
}
exports.deleteRole = async (req, res) => {
  const role = await Role.findById(req.params.id)
  if (!role) return res.status(404).json({ message: 'Role not found' })
  if (role.isSystem) return res.status(403).json({ message: 'System roles cannot be deleted' })
  if (await User.exists({ customRole: role._id })) return res.status(409).json({ message: 'Role is assigned to users' })
  await role.deleteOne(); await writeAudit(req, 'delete', 'role', role._id, { name: role.name })
  res.json({ message: 'Role deleted' })
}
exports.updateUserAccess = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (user.role === 'superadmin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Cannot change Super Admin access' })
  if (req.body.customRole !== undefined) {
    if (req.body.customRole) {
      const role = await Role.findOne({ _id: req.body.customRole, isActive: true })
      if (!role) return res.status(400).json({ message: 'Active role not found' })
    }
    user.customRole = req.body.customRole || undefined
  }
  if (req.body.permissionOverrides !== undefined) {
    user.permissionOverrides = (req.body.permissionOverrides || []).filter(p => modules.includes(p.module) && actions.includes(p.action))
  }
  await user.save()
  await writeAudit(req, 'edit', 'user-permissions', user._id, { customRole: user.customRole, overrides: user.permissionOverrides })
  res.json({ data: await User.findById(user._id).select('-password').populate('customRole') })
}
exports.audit = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  res.json({ data: await AuditLog.find().sort('-createdAt').limit(limit).populate('actor','name email role') })
}
