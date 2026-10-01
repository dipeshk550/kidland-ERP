const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const { Course, Assignment, Submission, Enrollment, AcademicSession } = require('../models')
const notifications = require('../services/notificationService')

const admin = user => ['superadmin', 'admin', 'coadmin'].includes(user.role)
const teacher = user => admin(user) || user.role === 'teacher'
const fail = (res, message, code = 500) => res.status(code).json({ message })
const ownsCourse = (req, id) => Course.findOne(admin(req.user) ? { _id: id } : { _id: id, $or: [{ instructor: req.user._id }, { createdBy: req.user._id }] })
const ownsAssignment = (req, id) => Assignment.findOne({ _id: id }).populate('course')
const studentCourseIds = async user => {
  const session = await AcademicSession.findOne({ isCurrent:true }).select('_id')
  const rows = session && await Enrollment.find({ student:user._id, session:session._id, status:'active' }).select('academicClass')
  // Attendance is deliberately not part of assignment access. A student who
  // was absent still belongs to the class and must be able to catch up.
  const classes = rows?.map(row => row.academicClass).filter(Boolean) || []
  const filter = {
    status: 'published',
    $or: [
      ...(classes.length ? [{ academicClass: { $in: classes } }] : []),
      ...(user.grade ? [{ grade: user.grade }] : []),
    ],
  }
  if (!filter.$or.length) filter._id = null
  return Course.find(filter).distinct('_id')
}
const availableToStudent = (assignment, user) => {
  const grades = assignment.availableGrades || []
  const students = assignment.availableStudents || []
  return (!grades.length && !students.length) || grades.includes(user.grade) || students.some(id => String(id) === String(user._id))
}

exports.list = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const courseIds = await studentCourseIds(req.user)
      const data = await Assignment.find({ status: 'published', course: { $in: courseIds } }).populate('course', 'title code').sort({ dueDate: 1, createdAt: -1 }).lean()
      const available = data.filter(item => availableToStudent(item, req.user))
      const submissions = await Submission.find({ student: req.user._id, assignment: { $in: available.map(a => a._id) } }).lean()
      const byAssignment = Object.fromEntries(submissions.map(s => [String(s.assignment), s]))
      return res.json({ data: available.map(item => ({ ...item, submission: byAssignment[String(item._id)] || null })) })
    }
    const courseFilter = admin(req.user) ? {} : { $or: [{ instructor: req.user._id }, { createdBy: req.user._id }] }
    const courses = await Course.find(courseFilter).select('_id')
    const filter = { course: { $in: courses.map(c => c._id) } }
    if (req.query.course) filter.course = req.query.course
    const data = await Assignment.find(filter).populate('course', 'title code').sort({ createdAt: -1 })
    res.json({ data })
  } catch (e) { fail(res, e.message) }
}

exports.get = async (req, res) => {
  try {
    const assignment = await ownsAssignment(req, req.params.id)
    if (!assignment) return fail(res, 'Assignment not found', 404)
    if (req.user.role === 'student') {
      const allowedCourse = (await studentCourseIds(req.user)).some(id => String(id) === String(assignment.course._id || assignment.course))
      const allowed = assignment.status === 'published' && allowedCourse && availableToStudent(assignment, req.user)
      if (!allowed) return fail(res, 'Assignment not found', 404)
      const submission = await Submission.findOne({ assignment: assignment._id, student: req.user._id })
      return res.json({ data: { assignment, submission } })
    }
    if (!teacher(req.user) || (!admin(req.user) && ![String(assignment.course.instructor), String(assignment.course.createdBy)].includes(String(req.user._id)))) return fail(res, 'Forbidden', 403)
    res.json({ data: assignment })
  } catch (e) { fail(res, e.message) }
}

exports.create = async (req, res) => {
  try {
    const course = await ownsCourse(req, req.body.course)
    if (!course) return fail(res, 'Course not found', 404)
    if (!req.body.title?.trim()) return fail(res, 'Assignment title is required', 400)
    if (req.body.dueDate && Number.isNaN(new Date(req.body.dueDate).getTime())) return fail(res, 'Invalid due date', 400)
    if (req.body.maxMarks !== undefined && (!Number.isFinite(Number(req.body.maxMarks)) || Number(req.body.maxMarks) < 0)) return fail(res, 'Maximum marks must be zero or greater', 400)
    const data = await Assignment.create({ ...req.body, course: course._id, createdBy: req.user._id })
    if (data.status === 'published') {
      const students = await notifications.courseStudents(course)
      await notifications.notify({ recipients:students, type:'assignment', title:'New assignment', message:`${data.title} is now available`, link:'/lms/assignments' })
      await notifications.notifyParents(students, { type:'assignment', title:'New assignment', message:`${data.title} is now available`, link:'/lms/assignments' })
    }
    res.status(201).json({ message: 'Assignment created', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.update = async (req, res) => {
  try {
    const assignment = await ownsAssignment(req, req.params.id)
    if (!assignment) return fail(res, 'Assignment not found', 404)
    if (!admin(req.user) && String(assignment.course.instructor) !== String(req.user._id) && String(assignment.course.createdBy) !== String(req.user._id)) return fail(res, 'Forbidden', 403)
    if (req.body.dueDate && Number.isNaN(new Date(req.body.dueDate).getTime())) return fail(res, 'Invalid due date', 400)
    if (req.body.maxMarks !== undefined && (!Number.isFinite(Number(req.body.maxMarks)) || Number(req.body.maxMarks) < 0)) return fail(res, 'Maximum marks must be zero or greater', 400)
    const updates = {}
    ;['title','instructions','dueDate','maxMarks','status','availableGrades','availableStudents'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    const data = await Assignment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    if (updates.status === 'published' && assignment.status !== 'published') {
      const students = await notifications.courseStudents(assignment.course)
      await notifications.notify({ recipients:students, type:'assignment', title:'Assignment published', message:`${data.title} is now available`, link:'/lms/assignments' })
      await notifications.notifyParents(students, { type:'assignment', title:'Assignment published', message:`${data.title} is now available`, link:'/lms/assignments' })
    }
    res.json({ message: 'Assignment updated', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.submit = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return fail(res, 'Assignment is not available', 404)
    if (assignment.status === 'closed') return fail(res, 'Assignment is closed', 400)
    if (assignment.status !== 'published') return fail(res, 'Assignment is not available', 404)
    const allowedCourse = (await studentCourseIds(req.user)).some(id => String(id) === String(assignment.course))
    const allowed = allowedCourse && availableToStudent(assignment, req.user)
    if (!allowed) return fail(res, 'Assignment is not available', 403)
    const late = assignment.dueDate && new Date() > new Date(assignment.dueDate)
    const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id }).select('_id')
    if (existing) return fail(res, 'A submission already exists for this assignment', 409)
    let bodyAttachment = req.body.attachment
    if (typeof bodyAttachment === 'string') {
      try { bodyAttachment = JSON.parse(bodyAttachment) } catch { return fail(res, 'Invalid attachment', 400) }
    }
    const attachment = req.file ? {
      name: req.file.originalname.slice(0, 255),
      url: `/uploads/images/${req.file.filename}`,
      mime: req.file.mimetype,
      size: req.file.size,
    } : bodyAttachment && String(bodyAttachment.url || '').startsWith('/uploads/') && {
      name: String(bodyAttachment.name || '').slice(0, 255),
      url: String(bodyAttachment.url || '').slice(0, 1000),
      mime: String(bodyAttachment.mime || '').slice(0, 100),
      size: Math.max(0, Number(bodyAttachment.size) || 0),
    }
    if (!String(req.body.text || '').trim() && !attachment) return fail(res, 'A text response or file attachment is required', 400)
    const data = await Submission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user._id },
      { text: req.body.text, attachment, status: late ? 'late' : 'submitted', submittedAt: new Date() },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    )
    res.json({ message: 'Submission saved', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.submissions = async (req, res) => {
  try {
    const assignment = await ownsAssignment(req, req.params.id)
    if (!assignment) return fail(res, 'Assignment not found', 404)
    if (!admin(req.user) && String(assignment.course.instructor) !== String(req.user._id) && String(assignment.course.createdBy) !== String(req.user._id)) return fail(res, 'Forbidden', 403)
    const data = await Submission.find({ assignment: assignment._id }).populate('student', 'name email grade').populate('assignment', 'title maxMarks').sort({ submittedAt: -1 })
    res.json({ data })
  } catch (e) { fail(res, e.message) }
}

exports.grade = async (req, res) => {
  try {
    const assignment = await ownsAssignment(req, req.params.assignmentId)
    if (!assignment) return fail(res, 'Assignment not found', 404)
    if (!admin(req.user) && String(assignment.course.instructor) !== String(req.user._id) && String(assignment.course.createdBy) !== String(req.user._id)) return fail(res, 'Forbidden', 403)
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Invalid submission', 400)
    const marks = Number(req.body.marks)
    if (!Number.isFinite(marks) || marks < 0 || marks > assignment.maxMarks) return fail(res, `Marks must be between 0 and ${assignment.maxMarks}`, 400)
    const data = await Submission.findOneAndUpdate({ _id: req.params.id, assignment: assignment._id }, { marks, feedback: req.body.feedback, status: req.body.status || 'graded', gradedAt: new Date(), gradedBy: req.user._id }, { new: true, runValidators: true }).populate('student', 'name email grade')
    if (!data) return fail(res, 'Submission not found', 404)
    await notifications.notify({ recipients:[data.student._id || data.student], type:'grade', title:'Assignment graded', message:`Your submission for ${assignment.title} was graded`, link:'/lms/assignments' })
    await notifications.notifyParents([data.student._id || data.student], { type:'grade', title:'Assignment graded', message:`A submission for ${assignment.title} was graded`, link:'/lms/assignments' })
    res.json({ message: 'Submission graded', data })
  } catch (e) { fail(res, e.message, 400) }
}

exports.downloadAttachment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Attachment not found', 404)
    const submission = await Submission.findById(req.params.id).populate('assignment', 'createdBy course')
    if (!submission?.attachment?.url) return fail(res, 'Attachment not found', 404)
    const isOwner = String(submission.student) === String(req.user._id)
    const course = submission.assignment?.course && await Course.findById(submission.assignment.course).select('instructor createdBy')
    const isReviewer = admin(req.user) || String(course?.instructor) === String(req.user._id) || String(course?.createdBy) === String(req.user._id)
    if (!isOwner && !isReviewer) return fail(res, 'Forbidden', 403)
    const root = path.resolve(__dirname, '../uploads')
    const file = path.resolve(root, path.basename(submission.attachment.url))
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return fail(res, 'Attachment not found', 404)
    return res.sendFile(file)
  } catch (e) { return fail(res, 'Attachment not found', 404) }
}
