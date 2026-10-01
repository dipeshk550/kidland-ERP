const r = require('express').Router()
const c = require('../controllers/resultController')
const { protect, authorize } = require('../middleware/authMiddleware')

r.get('/lookup', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.set('Pragma', 'no-cache')
  next()
}, c.lookupResult)
r.get('/parent', protect, c.parentLookup)
r.get('/meta',           protect, authorize('results'), c.getMeta)
r.get('/export',         protect, authorize('results', 'export'), c.exportResults)
r.get('/',               protect, authorize('results'), c.getAllResults)
r.post('/',              protect, authorize('results'), c.createResult)
r.post('/bulk-import',   protect, authorize('results'), c.bulkImport)
r.post('/toggle-publish',protect, authorize('results', 'approve'), c.togglePublish)
r.put('/:id',            protect, authorize('results'), c.updateResult)
r.delete('/:id',         protect, authorize('results'), c.deleteResult)
module.exports = r
