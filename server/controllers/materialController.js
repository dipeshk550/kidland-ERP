const { Course, Lesson, LearningMaterial, Enrollment, AcademicSession } = require('../models')
const path = require('path')
const admin = u => ['superadmin','coadmin'].includes(u.role)
exports.upload = async (req, res) => {
  try {
    const course = await Course.findOne(admin(req.user) ? { _id:req.body.course } : { _id:req.body.course, $or:[{ instructor:req.user._id },{ createdBy:req.user._id }] })
    if (!course || !req.file || !req.body.title?.trim()) return res.status(400).json({ message:'Course, title, and file are required' })
    if (req.body.lesson && !await Lesson.exists({ _id:req.body.lesson, course:course._id })) return res.status(400).json({ message:'Lesson does not belong to the selected course' })
    const data = await LearningMaterial.create({ course:course._id, lesson:req.body.lesson || undefined, title:req.body.title, url:`/uploads/images/${req.file.filename}`, originalName:req.file.originalname, mime:req.file.mimetype, size:req.file.size, createdBy:req.user._id })
    res.status(201).json({ message:'Material uploaded', data })
  } catch (e) { res.status(400).json({ message:e.message }) }
}
exports.list = async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ isCurrent: true }).select('_id')
    const enrollments = session && await Enrollment.find({ student: req.user._id, session: session._id, status: 'active' }).select('academicClass')
    const studentAvailability = enrollments?.length
      ? { academicClass: { $in: enrollments.map(row => row.academicClass) } }
      : { grade: req.user.grade }
    const filter = req.user.role === 'student'
      ? { _id:req.params.courseId, status:'published', ...studentAvailability }
      : admin(req.user)
        ? { _id:req.params.courseId }
        : { _id:req.params.courseId, $or:[{ instructor:req.user._id }, { createdBy:req.user._id }] }
    if (!await Course.exists(filter)) return res.status(404).json({ message:'Course not found' })
    res.json({ data: await LearningMaterial.find({ course:req.params.courseId }).populate('lesson','title').sort('-createdAt') })
  } catch (e) { res.status(500).json({ message:e.message }) }
}
exports.download = async (req, res) => {
    try {
      const material = await LearningMaterial.findById(req.params.id)
      if (!material) return res.status(404).json({ message: 'Material not found' })
      const courseFilter = admin(req.user) || req.user.role === 'teacher'
        ? (admin(req.user) ? { _id: material.course } : { _id: material.course, $or: [{ instructor: req.user._id }, { createdBy: req.user._id }] })
        : { _id: material.course, status: 'published' }
      if (req.user.role === 'student') {
        const session = await AcademicSession.findOne({ isCurrent: true }).select('_id')
        const enrollments = session && await Enrollment.find({ student: req.user._id, session: session._id, status: 'active' }).select('academicClass')
        if (enrollments?.length) courseFilter.academicClass = { $in: enrollments.map(row => row.academicClass) }
        else courseFilter.grade = req.user.grade
      }
      if (!await Course.exists(courseFilter)) return res.status(403).json({ message: 'Material access denied' })
      const filename = path.basename(material.url || '')
      if (!filename || filename !== material.url.split('/').pop()) return res.status(400).json({ message: 'Invalid material path' })
      res.download(path.join(__dirname, '../uploads/images', filename), material.originalName || material.title)
    } catch (e) { res.status(500).json({ message: e.message }) }
}
