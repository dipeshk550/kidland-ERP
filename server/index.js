const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express()

// ── Security middleware ───────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(mongoSanitize())
app.use(xss())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: req => ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
}))
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20 }))

// ── CORS — allow localhost + all production domains ───────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://kidlandschool.edu.np',
  'https://www.kidlandschool.edu.np',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'))

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'))
app.use('/api/news',          require('./routes/newsRoutes'))
app.use('/api/events',        require('./routes/eventRoutes'))
app.use('/api/gallery',       require('./routes/galleryRoutes'))
app.use('/api/notices',       require('./routes/noticeRoutes'))
app.use('/api/teachers',      require('./routes/teacherRoutes'))
app.use('/api/alumni',        require('./routes/alumniRoutes'))
app.use('/api/results',       require('./routes/resultRoutes'))
app.use('/api/admissions',    require('./routes/admissionRoutes'))
app.use('/api/users',         require('./routes/userRoutes'))
app.use('/api/rbac',          require('./routes/rbacRoutes'))
app.use('/api/settings',      require('./routes/settingsRoutes'))
app.use('/api/whatsapp',      require('./routes/whatsappRoutes'))
app.use('/api/contact',       require('./routes/contactRoutes'))
app.use('/api/fees',          require('./routes/feeRoutes'))
app.use('/api/library',       require('./routes/libraryRoutes'))
app.use('/api/transport',     require('./routes/transportRoutes'))
app.use('/api/lms',           require('./routes/lmsRoutes'))
app.use('/api/notifications', require('./routes/notificationRoutes'))
app.use('/api/relationships', require('./routes/relationshipRoutes'))
app.use('/api/attendance',    require('./routes/attendanceRoutes'))

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }))

// ── Serve React build (production SPA) ───────────────────
const distPath = path.join(__dirname, '../client/dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '7d', immutable: true }))
  // SPA fallback — send index.html for every non-API route
  // so React Router handles /admin/dashboard, /news/:id, etc.
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' })
    }
    res.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  // Dev mode — no build present, return 404 for unknown routes
  app.use('*', (req, res) => res.status(404).json({ message: 'Route not found' }))
}

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.statusCode || 500
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : (err.message || 'Request failed'),
  })
})

// ── Database + start ──────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kidland_school')
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000} [${process.env.NODE_ENV || 'development'}]`)
    )
  })
  .catch(err => { console.error('DB error:', err); process.exit(1) })
