const r = require('express').Router()
const { Settings } = require('../models/index')
const { protect, authorize } = require('../middleware/authMiddleware')
r.get('/', async (req, res) => {
  try { const s = await Settings.find(); const obj = {}; s.forEach(x=>{ obj[x.key]=x.value }); res.json({ data: obj }) }
  catch(err) { res.status(500).json({ message: err.message }) }
})
r.put('/', protect, authorize('settings'), async (req, res) => {
  try {
    const entries = Object.entries(req.body)
    if (entries.length === 0) return res.json({ message: 'No changes to save' })
    const ops = entries.map(([key,value]) => ({ updateOne:{ filter:{key}, update:{$set:{key,value}}, upsert:true } }))
    await Settings.bulkWrite(ops)
    res.json({ message: 'Settings saved' })
  } catch(err) { res.status(500).json({ message: err.message }) }
})
module.exports = r
