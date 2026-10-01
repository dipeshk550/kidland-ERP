require('dotenv').config()
const mongoose = require('mongoose')
const { User, Gallery } = require('./models/index')

const SEED_GALLERY = [
  { title: 'School Activities', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/WhatsApp-Image-2026-03-19-at-4.52.21-PM.jpeg', cat: 'Students' },
  { title: 'Student Life', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5326-scaled.jpg', cat: 'Students' },
  { title: 'School Events', src: 'https://kidlandschool.edu.np/wp-content/uploads/2025/08/IMG_2262-1-scaled.jpg', cat: 'Events' },
  { title: 'Sports Day', src: 'https://kidlandschool.edu.np/wp-content/uploads/2025/07/IMG_0893-scaled.jpg', cat: 'Sports' },
  { title: 'Activities', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5607-scaled.jpg', cat: 'Students' },
  { title: 'ECA Activities', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5260-scaled.jpg', cat: 'ECA' },
  { title: 'Cultural Events', src: 'https://kidlandschool.edu.np/wp-content/uploads/2025/09/IMG_3237-1-scaled.jpg', cat: 'Cultural' },
  { title: 'School Life', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/02/WhatsApp-Image-2026-02-19-at-4.33.27-PM-2-1.jpeg', cat: 'Students' },
  { title: 'Programme', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/WhatsApp-Image-2026-03-19-at-4.52.23-PM.jpeg', cat: 'Events' },
  { title: 'Students', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/02/WhatsApp-Image-2026-02-19-at-4.33.15-PM-1-1.jpeg', cat: 'Students' },
  { title: 'School Events', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5299-1-scaled.jpg', cat: 'Events' },
  { title: 'ECA Programme', src: 'https://kidlandschool.edu.np/wp-content/uploads/2026/03/IMG_5549-scaled.jpg', cat: 'ECA' },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kidland_school')
  console.log('Connected to MongoDB')
  const existing = await User.findOne({ role: 'superadmin' })
  if (!existing) {
    await User.create({ name:'Super Admin', email:'admin@kidland.edu.np', password:'admin123456', role:'superadmin', isActive:true })
    await User.create({ name:'Co Admin', email:'coadmin@kidland.edu.np', password:'coadmin123', role:'coadmin', isActive:true })
    console.log('[OK] Super Admin: admin@kidland.edu.np / admin123456')
    console.log('[OK] Co Admin:    coadmin@kidland.edu.np / coadmin123')
  }

  const galCount = await Gallery.countDocuments()
  if (galCount === 0) {
    await Gallery.insertMany(SEED_GALLERY)
    console.log('[OK] Seeded initial gallery images')
  }

  console.log('Seeding complete!')
  process.exit(0)
}
seed().catch(err => { console.error(err); process.exit(1) })
