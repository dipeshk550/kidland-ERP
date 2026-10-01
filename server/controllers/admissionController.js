const { Admission } = require('../models/index')
const path = require('path')
const fs = require('fs')
const { getAll, getOne, remove } = require('./crudController')

exports.getAllAdmissions = getAll(Admission)
exports.getAdmission     = getOne(Admission)
exports.deleteAdmission  = remove(Admission)

// Helper: extract uploaded file path
const getPath = (files, field) =>
  files[field]?.[0] ? `/uploads/documents/${files[field][0].filename}` : null

// POST /api/admissions — public (no auth), handles multipart form + file uploads
exports.createAdmission = async (req, res) => {
  try {
    const files = req.files || {}
    const studentPhoto = getPath(files, 'studentPhoto')
    const birthCert    = getPath(files, 'birthCert')
    const markSheet    = getPath(files, 'markSheet')
    const transferCert = getPath(files, 'transferCert')
    const docPaths     = [birthCert, markSheet, transferCert].filter(Boolean)

    const data = await Admission.create({
      ...req.body,
      studentPhoto,
      birthCert,
      markSheet,
      transferCert,
      documents: docPaths,
    })
    res.status(201).json({ message: 'Application submitted', data })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PUT /api/admissions/:id — update status, note, or any field (admin only)
exports.updateAdmission = async (req, res) => {
  try {
    const { status, note, ...rest } = req.body
    const updateData = { ...rest }
    if (status)            updateData.status     = status
    if (note !== undefined) updateData.note       = note
    if (status)            updateData.reviewedBy  = req.user._id
    if (status)            updateData.reviewedAt  = new Date()

    const app = await Admission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    if (!app) return res.status(404).json({ message: 'Application not found' })
    res.json({ message: 'Application updated', data: app })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PUT /api/admissions/:id/status — kept for backward compat
exports.updateStatus = exports.updateAdmission

exports.getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Admission.countDocuments(),
      Admission.countDocuments({ status: 'pending' }),
      Admission.countDocuments({ status: 'approved' }),
      Admission.countDocuments({ status: 'rejected' }),
    ])
    res.json({ total, pending, approved, rejected })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.downloadDocument = async (req, res) => {
    const allowed = ['studentPhoto', 'birthCert', 'markSheet', 'transferCert']
    if (!allowed.includes(req.params.field)) return res.status(404).json({ message: 'Document not found' })
    if (!require('mongoose').isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Document not found' })
    const app = await Admission.findById(req.params.id).select(req.params.field)
    const stored = app?.[req.params.field]
    if (!stored) return res.status(404).json({ message: 'Document not found' })
    const relativePath = stored.replace(/^\/+/, '')
    if (!relativePath.startsWith('uploads/')) return res.status(404).json({ message: 'Document not found' })
    const root = path.resolve(__dirname, '..')
    const file = path.resolve(root, relativePath)
    if (!file.startsWith(root + path.sep)) return res.status(404).json({ message: 'Document not found' })
    if (!fs.existsSync(file)) return res.status(404).json({ message: 'Document not found' })
    return res.sendFile(file)
}
