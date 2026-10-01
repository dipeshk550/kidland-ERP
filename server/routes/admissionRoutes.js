const r = require('express').Router()
const c = require('../controllers/admissionController')
const { protect, authorize } = require('../middleware/authMiddleware')
const upload = require('../middleware/uploadMiddleware')

// Accept all file fields from the public admission form
const docsUpload = upload.fields([
  { name: 'studentPhoto', maxCount: 1 },
  { name: 'birthCert',    maxCount: 1 },
  { name: 'markSheet',    maxCount: 1 },
  { name: 'transferCert', maxCount: 1 },
])

r.get('/stats',  protect, authorize('admissions'), c.getStats)
r.get('/',       protect, authorize('admissions'), c.getAllAdmissions)
r.get('/:id',    protect, authorize('admissions'), c.getAdmission)
r.get('/:id/documents/:field', protect, authorize('admissions','export'), c.downloadDocument)
r.post('/',      docsUpload, c.createAdmission)          // public — no auth required
r.put('/:id',    protect, authorize('admissions'), c.updateAdmission)
r.put('/:id/status', protect, authorize('admissions', 'approve'), c.updateStatus)
r.delete('/:id', protect, authorize('admissions'), c.deleteAdmission)

module.exports = r
