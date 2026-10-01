const r = require('express').Router()
const { Contact } = require('../models/index')
const { protect, authorize } = require('../middleware/authMiddleware')

// POST /api/contact — public, no auth
r.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body
    if (!name || !email || !subject || !message)
      return res.status(400).json({ message: 'Name, email, subject and message are required' })
    const doc = await Contact.create({ name, email, phone, subject, message })
    res.status(201).json({ message: 'Message received', data: doc })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// GET /api/contact — admin only
r.get('/', protect, authorize('contacts'), async (req, res) => {
  try {
    const { page = 1, limit = 15, status, search = '' } = req.query
    const query = {}
    if (status && status !== 'all') query.status = status
    if (search) query.$or = [
      { name:    new RegExp(search, 'i') },
      { email:   new RegExp(search, 'i') },
      { subject: new RegExp(search, 'i') },
    ]
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [data, total] = await Promise.all([
      Contact.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Contact.countDocuments(query),
    ])
    res.json({ data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/contact/:id — admin only
r.get('/:id', protect, authorize('contacts'), async (req, res) => {
  try {
    const doc = await Contact.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    // Auto-mark as read when viewed
    if (doc.status === 'unread') await Contact.findByIdAndUpdate(req.params.id, { status: 'read' })
    res.json({ data: doc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/contact/:id — update status / note (admin only)
r.put('/:id', protect, authorize('contacts'), async (req, res) => {
  try {
    const { status, note } = req.body
    const update = {}
    if (status) update.status = status
    if (note !== undefined) update.note = note
    const doc = await Contact.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Updated', data: doc })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// DELETE /api/contact/:id — admin only
r.delete('/:id', protect, authorize('contacts'), async (req, res) => {
  try {
    const doc = await Contact.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = r
