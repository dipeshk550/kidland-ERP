const mongoose = require('mongoose')

// Escape special regex chars to prevent ReDoS from user search input
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Validate MongoDB ObjectId
const isValidId = id => mongoose.isValidObjectId(id)

exports.getAll = (Model, populate='') => async (req, res) => {
  try {
    const { page=1, limit=20, search='', status, cat, sort='-createdAt' } = req.query
    const safeLimit = Math.min(Math.max(parseInt(limit)||20, 1), 200) // cap at 200
    const query = {}
    if (status) query.status = status
    if (cat && cat !== 'All') query.cat = cat
    if (search) {
      const safe = escapeRegex(String(search).slice(0, 100)) // max 100 chars, escaped
      query.$or = [
        { title:       new RegExp(safe, 'i') },
        { name:        new RegExp(safe, 'i') },
        { role:        new RegExp(safe, 'i') },
        { position:    new RegExp(safe, 'i') },
        { dept:        new RegExp(safe, 'i') },
        { department:  new RegExp(safe, 'i') },
        { cat:         new RegExp(safe, 'i') },
        { batch:       new RegExp(safe, 'i') },
        { studentName: new RegExp(safe, 'i') },
      ]
    }
    const skip = (Math.max(parseInt(page)||1, 1) - 1) * safeLimit
    const [data, total] = await Promise.all([
      Model.find(query).sort(sort).skip(skip).limit(safeLimit).populate(populate),
      Model.countDocuments(query),
    ])
    res.json({ data, total, page: parseInt(page)||1, pages: Math.ceil(total / safeLimit) })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.getOne = Model => async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' })
    const doc = await Model.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ data: doc })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.create = Model => async (req, res) => {
  try {
    const doc = await Model.create({ ...req.body, ...(req.user && { author: req.user._id, postedBy: req.user._id, uploadedBy: req.user._id }) })
    res.status(201).json({ message: 'Created', data: doc })
  } catch(err) { res.status(400).json({ message: err.message }) }
}
exports.update = Model => async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' })
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Updated', data: doc })
  } catch(err) { res.status(400).json({ message: err.message }) }
}
exports.remove = Model => async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' })
    const doc = await Model.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
