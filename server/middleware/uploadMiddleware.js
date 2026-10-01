const multer = require('multer')
const path = require('path')
const fs = require('fs')

const DOC_FIELDS = ['birthCert', 'markSheet', 'transferCert', 'document', 'studentPhoto']

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isDoc = DOC_FIELDS.includes(file.fieldname)
    const dir = path.join(__dirname, '../uploads/', isDoc ? 'documents' : 'images')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
})

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '')
  if (['jpeg', 'jpg', 'png', 'webp', 'gif', 'pdf'].includes(ext)) cb(null, true)
  else cb(new Error('File type not allowed'), false)
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
})
