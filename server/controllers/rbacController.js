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
  try {
    const { page = 1, limit = 50, action, entity, search, from, to, actorId } = req.query
    const safeLimit = Math.min(Number(limit) || 50, 200)
    const query = {}

    if (action)   query.action = action
    if (entity)   query.entity = entity
    if (actorId)  query.actor  = actorId

    // Date range filter
    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to)   query.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999))
    }

    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit

    // If searching by actor name we need a pipeline
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80)
      const pipeline = [
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $lookup: { from: 'users', localField: 'actor', foreignField: '_id', as: 'actorDoc' } },
        { $unwind: { path: '$actorDoc', preserveNullAndEmpty: true } },
        { $match: { $or: [
          { 'actorDoc.name':  new RegExp(safe, 'i') },
          { 'actorDoc.email': new RegExp(safe, 'i') },
          { action:           new RegExp(safe, 'i') },
          { entity:           new RegExp(safe, 'i') },
        ]}},
        { $facet: {
          data:  [{ $skip: skip }, { $limit: safeLimit }],
          total: [{ $count: 'n' }],
        }},
      ]
      const [result] = await AuditLog.aggregate(pipeline)
      const data  = (result?.data || []).map(doc => ({
        ...doc,
        actor: doc.actorDoc ? { _id: doc.actorDoc._id, name: doc.actorDoc.name, email: doc.actorDoc.email, role: doc.actorDoc.role } : null,
      }))
      return res.json({ data, total: result?.total?.[0]?.n || 0, page: Number(page), pages: Math.ceil((result?.total?.[0]?.n || 0) / safeLimit) })
    }

    const [data, total] = await Promise.all([
      AuditLog.find(query).sort('-createdAt').skip(skip).limit(safeLimit).populate('actor', 'name email role'),
      AuditLog.countDocuments(query),
    ])
    res.json({ data, total, page: Number(page) || 1, pages: Math.ceil(total / safeLimit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
