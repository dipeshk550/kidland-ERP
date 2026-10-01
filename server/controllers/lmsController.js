const mongoose = require('mongoose')
const { Course, CourseModule, Lesson, LessonProgress, User, Assignment, Submission, Quiz, QuizAttempt, LearningMaterial, Enrollment, AcademicSession } = require('../models')
const notifications = require('../services/notificationService')

const isAdmin = user => ['superadmin', 'admin', 'coadmin'].includes(user.role)
const fail = (res, message, code = 500) => res.status(code).json({ message })
const pageOpts = q => {
  const page = Math.max(1, Number.parseInt(q.page, 10) || 1)
  const limit = Math.min(100, Number.parseInt(q.limit, 10) || 20)
  return { page, limit, skip: (page - 1) * limit }
}
const ownedFilter = (req, extra = {}) =>
  isAdmin(req.user) ? extra : { ...extra, $or: [{ instructor: req.user._id }, { createdBy: req.user._id }] }
const studentCourseFilter = async user => {
  const session = await AcademicSession.findOne({ isCurrent: true }).select('_id')
  const enrollments = session && await Enrollment.find({ student: user._id, session: session._id, status: 'active' }).select('academicClass')
  const classes = enrollments?.map(row => row.academicClass).filter(Boolean) || []
  const filter = {
    status: 'published',
    $or: [
      ...(classes.length ? [{ academicClass: { $in: classes } }] : []),
      ...(user.grade ? [{ grade: user.grade }] : []),
    ],
  }
  if (!filter.$or.length) filter._id = null
  return filter
}

exports.summary = async (req, res) => {
  try {
    const filter = ownedFilter(req)
    const courseIds = await Course.find(filter).distinct('_id')
    const [total, published, drafts, recent] = await Promise.all([
      Course.countDocuments(filter),
      Course.countDocuments({ ...filter, status: 'published' }),
      Course.countDocuments({ ...filter, status: 'draft' }),
      Course.find(filter).populate('instructor', 'name').sort({ createdAt: -1 }).limit(5).lean(),
    ])
    const assignmentIds = await Assignment.find({ course: { $in: courseIds } }).distinct('_id')
    const quizIds = await Quiz.find({ course: { $in: courseIds } }).distinct('_id')
    const [modules, lessons, assignments, publishedAssignments, submissions, quizzes, attempts, recentAssignments, recentQuizzes] = await Promise.all([
      CourseModule.countDocuments({ course: { $in: courseIds } }),
      Lesson.countDocuments({ course: { $in: courseIds } }),
      Assignment.countDocuments({ _id: { $in: assignmentIds } }),
      Assignment.countDocuments({ _id: { $in: assignmentIds }, status: 'published' }),
      Submission.countDocuments({ assignment: { $in: assignmentIds } }),
      Quiz.countDocuments({ _id: { $in: quizIds } }),
      QuizAttempt.countDocuments({ quiz: { $in: quizIds } }),
      Assignment.find({ _id: { $in: assignmentIds } }).populate('course', 'title').sort({ createdAt: -1 }).limit(5).lean(),
      Quiz.find({ _id: { $in: quizIds } }).populate('course', 'title').sort({ createdAt: -1 }).limit(5).lean(),
    ])
    res.json({ data: {
      totalCourses: total, publishedCourses: published, draftCourses: drafts,
      totalModules: modules, totalLessons: lessons, totalAssignments: assignments,
      publishedAssignments, totalSubmissions: submissions, totalQuizzes: quizzes, totalAttempts: attempts,
      recentCourses: recent, recentAssignments, recentQuizzes,
    } })
  } catch (e) { fail(res, e.message) }
}

exports.listCourses = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = ownedFilter(req)
    if (req.query.status) filter.status = req.query.status
    if (req.query.search) filter.$text = { $search: req.query.search }
    const [data, total] = await Promise.all([
      Course.find(filter).populate('instructor', 'name email').populate('academicClass', 'name sections').populate('session', 'name startsOn endsOn').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Course.countDocuments(filter),
    ])
    res.json({ data, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { fail(res, e.message) }
}

exports.createCourse = async (req, res) => {
  try {
    const { title, code, description, grade, subject, status, academicClass, session } = req.body
    if (!title?.trim()) return fail(res, 'Course title is required', 400)
    let instructor = req.user._id
    if (isAdmin(req.user) && req.body.instructor) {
      const teacher = await User.findOne({ _id: req.body.instructor, role: 'teacher', isActive: true })
      if (!teacher) return fail(res, 'Active teacher not found', 400)
      instructor = teacher._id
    }
    const doc = await Course.create({ title, code, description, grade, subject, status, academicClass, session, instructor, createdBy: req.user._id })
    if (instructor.toString() !== req.user._id.toString()) await notifications.notify({ recipients:[instructor], type:'course', title:'Course assigned', message:`You were assigned to teach ${doc.title}`, link:'/admin/lms/courses' })
    res.status(201).json({ message: 'Course created', data: doc })
  } catch (e) { fail(res, e.message, 400) }
}

exports.updateCourse = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Invalid course', 400)
    const doc = await Course.findOne(ownedFilter(req, { _id: req.params.id }))
    if (!doc) return fail(res, 'Course not found', 404)
    const allowed = ['title', 'code', 'description', 'grade', 'subject', 'status', 'academicClass', 'session']
    allowed.forEach(key => { if (req.body[key] !== undefined) doc[key] = req.body[key] })
    if (isAdmin(req.user) && req.body.instructor) {
      const teacher = await User.findOne({ _id: req.body.instructor, role: 'teacher', isActive: true })
      if (!teacher) return fail(res, 'Active teacher not found', 400)
      doc.instructor = teacher._id
    }
    await doc.save()
    res.json({ message: 'Course updated', data: doc })
  } catch (e) { fail(res, e.message, 400) }
}

exports.duplicateCourse = async (req, res) => {
  try {
    const source = await Course.findOne(ownedFilter(req, { _id: req.params.id }))
    if (!source) return fail(res, 'Course not found', 404)
    const copy = await Course.create({ title: `${source.title} (Copy)`, code: source.code ? `${source.code}-COPY` : undefined, description: source.description, grade: source.grade, subject: source.subject, academicClass: source.academicClass, session: source.session, status: 'draft', instructor: source.instructor, createdBy: req.user._id })
    const modules = await CourseModule.find({ course: source._id }).lean()
    const moduleMap = new Map()
    for (const module of modules) {
      const created = await CourseModule.create({ course: copy._id, title: module.title, description: module.description, order: module.order, status: 'draft' })
      moduleMap.set(String(module._id), created._id)
    }
    const lessons = await Lesson.find({ course: source._id }).lean()
    const lessonMap = new Map()
    for (const lesson of lessons) {
      const created = await Lesson.create({ course: copy._id, module: lesson.module ? moduleMap.get(String(lesson.module)) : undefined, title: lesson.title, description: lesson.description, order: lesson.order, contentType: lesson.contentType, content: lesson.content, duration: lesson.duration, visibility: 'hidden', status: 'draft', isPublished: false })
      lessonMap.set(String(lesson._id), created._id)
    }
    const assignments = await Assignment.find({ course: source._id }).lean()
    if (assignments.length) await Assignment.insertMany(assignments.map(item => ({ course: copy._id, title: item.title, instructions: item.instructions, dueDate: item.dueDate, maxMarks: item.maxMarks, status: 'draft', availableGrades: item.availableGrades, availableStudents: item.availableStudents, createdBy: req.user._id })))
    const quizzes = await Quiz.find({ course: source._id }).lean()
    if (quizzes.length) await Quiz.insertMany(quizzes.map(item => ({ course: copy._id, title: item.title, instructions: item.instructions, status: 'draft', questions: item.questions, createdBy: req.user._id })))
    const materials = await LearningMaterial.find({ course: source._id }).lean()
    if (materials.length) await LearningMaterial.insertMany(materials.map(item => ({ course: copy._id, lesson: item.lesson ? lessonMap.get(String(item.lesson)) : undefined, title: item.title, url: item.url, originalName: item.originalName, mime: item.mime, size: item.size, createdBy: req.user._id })))
    res.status(201).json({ message: 'Course duplicated as draft', data: copy, copied: { modules: modules.length, lessons: lessons.length, assignments: assignments.length, quizzes: quizzes.length, materials: materials.length } })
  } catch (e) { fail(res, e.message, 400) }
}
exports.previewCourse = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.id })).populate('instructor', 'name email').populate('academicClass', 'name sections').populate('session', 'name')
    if (!course) return fail(res, 'Course not found', 404)
    const [modules, lessons, assignments, quizzes, materials] = await Promise.all([
      CourseModule.find({ course: course._id }).sort('order'),
      Lesson.find({ course: course._id }).populate('module', 'title').sort('order'),
      Assignment.find({ course: course._id }).select('-availableStudents').sort('-createdAt'),
      Quiz.find({ course: course._id }).select('-questions.answer').sort('-createdAt'),
      LearningMaterial.find({ course: course._id }).populate('lesson', 'title').sort('-createdAt'),
    ])
    res.json({ data: { course, modules, lessons, assignments, quizzes, materials } })
  } catch (e) { fail(res, e.message) }
}

exports.listTeachers = async (req, res) => {
  try { res.json({ data: await User.find({ role:'teacher', isActive:true }).select('name email teacherProfile').populate('teacherProfile', 'name').sort('name') }) }
  catch (e) { fail(res, e.message) }
}

exports.studentCourses = async (req, res) => {
  try { res.json({ data: await Course.find(await studentCourseFilter(req.user)).populate('instructor','name').sort('title') }) }
  catch (e) { fail(res, e.message) }
}

exports.studentLessons = async (req, res) => {
  const course = await Course.findOne({ _id:req.params.courseId, ...(await studentCourseFilter(req.user)) })
  if (!course) return fail(res, 'Course not found', 404)
  const lessons = await Lesson.find({ course:course._id, status:'published', visibility:'visible' }).populate('module', 'title').sort('order')
  const completed = await LessonProgress.find({ student:req.user._id, lesson:{ $in: lessons.map(row => row._id) } }).select('lesson completedAt')
  const completedMap = new Map(completed.map(row => [String(row.lesson), row]))
  res.json({ data: lessons.map(lesson => ({ ...lesson.toObject(), progress: completedMap.get(String(lesson._id)) || null })) })
}

exports.listMaterials = async (req, res) => {
  try {
    const { LearningMaterial } = require('../models')
    const session = await AcademicSession.findOne({ isCurrent: true }).select('_id')
    const enrollments = session && await Enrollment.find({ student: req.user._id, session: session._id, status: 'active' }).select('academicClass')
    const availability = enrollments?.length
      ? { academicClass: { $in: enrollments.map(row => row.academicClass) } }
      : { grade: req.user.grade }
    const course = await Course.findOne(req.user.role === 'student'
      ? { _id: req.params.courseId, status: 'published', ...availability }
      : { _id: req.params.courseId })
    if (!course && req.user.role !== 'student') return fail(res, 'Course not found', 404)
    res.json({ data: await LearningMaterial.find({ course:req.params.courseId }).sort('-createdAt') })
  } catch (e) { fail(res, e.message) }
}

exports.deleteCourse = async (req, res) => {
  try {
    const doc = await Course.findOneAndDelete(ownedFilter(req, { _id: req.params.id }))
    if (!doc) return fail(res, 'Course not found', 404)
    const lessonIds = await Lesson.find({ course: doc._id }).distinct('_id')
    await LessonProgress.deleteMany({ lesson: { $in: lessonIds } })
    await Lesson.deleteMany({ course: doc._id })
    await CourseModule.deleteMany({ course: doc._id })
    await LearningMaterial.deleteMany({ course: doc._id })
    const assignmentIds = await Assignment.find({ course: doc._id }).distinct('_id')
    const quizIds = await Quiz.find({ course: doc._id }).distinct('_id')
    await Submission.deleteMany({ assignment: { $in: assignmentIds } })
    await QuizAttempt.deleteMany({ quiz: { $in: quizIds } })
    await Assignment.deleteMany({ _id: { $in: assignmentIds } })
    await Quiz.deleteMany({ _id: { $in: quizIds } })
    res.json({ message: 'Course deleted' })
  } catch (e) { fail(res, e.message) }
}

exports.listLessons = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    if (!course) return fail(res, 'Course not found', 404)
    const data = await Lesson.find({ course: course._id }).sort({ order: 1, createdAt: 1 })
    res.json({ data })
  } catch (e) { fail(res, e.message) }
}

exports.listModules = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    if (!course) return fail(res, 'Course not found', 404)
    const data = await CourseModule.find({ course: course._id }).sort({ order: 1, createdAt: 1 })
    res.json({ data })
  } catch (e) { fail(res, e.message) }
}

exports.createModule = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    if (!course) return fail(res, 'Course not found', 404)
    if (!req.body.title?.trim()) return fail(res, 'Module title is required', 400)
    const last = await CourseModule.findOne({ course: course._id }).sort({ order: -1 }).select('order').lean()
    const data = await CourseModule.create({ course: course._id, title: req.body.title, description: req.body.description, status: req.body.status, order: last ? last.order + 1 : 0 })
    res.status(201).json({ message: 'Module created', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.updateModule = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    const updates = {}
    ;['title', 'description', 'order', 'status'].forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key] })
    const data = course && await CourseModule.findOneAndUpdate({ _id: req.params.id, course: course._id }, updates, { new: true, runValidators: true })
    if (!data) return fail(res, 'Module not found', 404)
    res.json({ message: 'Module updated', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.deleteModule = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    const data = course && await CourseModule.findOneAndDelete({ _id: req.params.id, course: course._id })
    if (!data) return fail(res, 'Module not found', 404)
    await Lesson.updateMany({ module: data._id }, { $unset: { module: 1 } })
    res.json({ message: 'Module deleted' })
  } catch (e) { fail(res, e.message) }
}

exports.createLesson = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    if (!course) return fail(res, 'Course not found', 404)
    if (!req.body.title?.trim()) return fail(res, 'Lesson title is required', 400)
    const last = await Lesson.findOne({ course: course._id }).sort({ order: -1 }).select('order').lean()
    const allowed = ['title', 'description', 'contentType', 'content', 'duration', 'visibility', 'status', 'module']
    const values = { course: course._id, order: last ? last.order + 1 : 0 }
    allowed.forEach(key => { if (req.body[key] !== undefined) values[key] = req.body[key] })
    if (values.module && !await CourseModule.exists({ _id: values.module, course: course._id })) return fail(res, 'Invalid module', 400)
    values.isPublished = values.status === 'published' && values.visibility === 'visible'
    const data = await Lesson.create(values)
    res.status(201).json({ message: 'Lesson created', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.updateLesson = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    const updates = {}
    ;['title', 'description', 'order', 'contentType', 'content', 'duration', 'visibility', 'status', 'module'].forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    })
    if (updates.module && !await CourseModule.exists({ _id: updates.module, course: course?._id })) return fail(res, 'Invalid module', 400)
    if (updates.status !== undefined || updates.visibility !== undefined) {
      const current = await Lesson.findOne({ _id: req.params.id, course: course?._id }).select('status visibility')
      if (current) updates.isPublished = (updates.status ?? current.status) === 'published' && (updates.visibility ?? current.visibility) === 'visible'
    }
    const data = course && await Lesson.findOneAndUpdate({ _id: req.params.id, course: course._id }, updates, { new: true, runValidators: true })
    if (!data) return fail(res, 'Lesson not found', 404)
    res.json({ message: 'Lesson updated', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.deleteLesson = async (req, res) => {
  try {
    const course = await Course.findOne(ownedFilter(req, { _id: req.params.courseId }))
    const data = course && await Lesson.findOneAndDelete({ _id: req.params.id, course: course._id })
    if (!data) return fail(res, 'Lesson not found', 404)
    await LessonProgress.deleteMany({ lesson: data._id })
    await LearningMaterial.deleteMany({ lesson: data._id })
    res.json({ message: 'Lesson deleted' })
  } catch (e) { fail(res, e.message) }
}
