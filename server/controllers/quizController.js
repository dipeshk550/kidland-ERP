const { Course, Quiz, QuizAttempt, Enrollment, AcademicSession } = require('../models')
const notifications = require('../services/notificationService')
const staff = u => ['superadmin','coadmin','teacher'].includes(u.role)
const admin = u => ['superadmin','coadmin'].includes(u.role)
const fail = (res, message, code = 500) => res.status(code).json({ message })
const validQuestions = questions => questions.every(q => {
  const options = Array.isArray(q.options) ? q.options.map(option => String(option || '').trim()) : []
  const answer = Number(q.answer)
  const marks = Number(q.marks)
  return Boolean(String(q.prompt || '').trim()) &&
    options.length >= 2 &&
    options.every(Boolean) &&
    q.answer !== '' &&
    q.answer !== null &&
    Number.isInteger(answer) &&
    answer >= 0 &&
    answer < options.length &&
    q.marks !== '' &&
    q.marks !== null &&
    Number.isFinite(marks) &&
    marks >= 0
})
const courseFor = (req, id) => Course.findOne(admin(req.user) ? { _id: id } : { _id: id, $or: [{ instructor: req.user._id }, { createdBy: req.user._id }] })
const studentCourses = async user => {
  const session = await AcademicSession.findOne({ isCurrent:true }).select('_id')
  const rows = session && await Enrollment.find({ student:user._id, session:session._id, status:'active' }).select('academicClass')
  return Course.find(rows?.length ? { academicClass:{ $in:rows.map(row=>row.academicClass) }, status:'published' } : { grade:user.grade, status:'published' }).distinct('_id')
}

exports.list = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const data = await Quiz.find({ course: { $in: await studentCourses(req.user) }, status: 'published' }).select('-questions.answer').populate('course','title code')
      const attempts = await QuizAttempt.find({ student: req.user._id, quiz: { $in: data.map(q => q._id) } })
      const map = Object.fromEntries(attempts.map(a => [String(a.quiz), a]))
      return res.json({ data: data.map(q => ({ ...q.toObject(), attempt: map[String(q._id)] || null })) })
    }
    const courses = await Course.find(admin(req.user) ? {} : { $or: [{ instructor: req.user._id }, { createdBy: req.user._id }] }).select('_id')
    res.json({ data: await Quiz.find({ course: { $in: courses.map(c => c._id) } }).populate('course','title code').sort('-createdAt') })
  } catch (e) { fail(res, e.message) }
}
exports.create = async (req, res) => {
  try {
    const course = await courseFor(req, req.body.course)
    if (!course) return fail(res, 'Course not found', 404)
    if (!req.body.title || !Array.isArray(req.body.questions) || !req.body.questions.length) return fail(res, 'Title and at least one question are required', 400)
    if (!validQuestions(req.body.questions)) return fail(res, 'Each question needs a prompt, two non-empty options, a valid answer, and non-negative marks', 400)
    const data = await Quiz.create({ ...req.body, course: course._id, createdBy: req.user._id })
    res.status(201).json({ message: 'Quiz created', data })
  } catch (e) { fail(res, e.message, 400) }
}
exports.update = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course')
    if (!quiz) return fail(res, 'Quiz not found', 404)
    if (!admin(req.user) && String(quiz.course.instructor) !== String(req.user._id) && String(quiz.course.createdBy) !== String(req.user._id)) return fail(res, 'Forbidden', 403)
    if (!req.body.title?.trim() || !Array.isArray(req.body.questions) || !req.body.questions.length) return fail(res, 'Title and at least one question are required', 400)
    if (!validQuestions(req.body.questions)) return fail(res, 'Each question needs a prompt, two non-empty options, a valid answer, and non-negative marks', 400)
    const data = await Quiz.findByIdAndUpdate(req.params.id, { title:req.body.title, instructions:req.body.instructions, status:req.body.status, questions:req.body.questions }, { new:true, runValidators:true })
    res.json({ message: 'Quiz updated', data })
  } catch (e) { fail(res, e.message, 400) }
}
exports.attempt = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, status: 'published' })
    if (!quiz) return fail(res, 'Quiz not available', 404)
    const course = await Course.findOne({ _id: quiz.course, _id: { $in: await studentCourses(req.user) } })
    if (!course) return fail(res, 'Quiz not available', 403)
    const answers = Array.isArray(req.body.answers) ? req.body.answers : []
    const existing = await QuizAttempt.findOne({ quiz: quiz._id, student: req.user._id }).select('_id')
    if (existing) return fail(res, 'This quiz has already been attempted', 409)
    if (answers.length !== quiz.questions.length || answers.some((answer, i) => !Number.isInteger(Number(answer)) || Number(answer) < 0 || Number(answer) >= quiz.questions[i].options.length)) return fail(res, 'Complete every quiz question with a valid option', 400)
    const score = quiz.questions.reduce((sum, q, i) => sum + (Number(answers[i]) === q.answer ? q.marks : 0), 0)
    const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0)
    const data = await QuizAttempt.create({ quiz: quiz._id, student: req.user._id, answers, score, totalMarks, submittedAt: new Date() })
    await notifications.notify({ recipients:[req.user._id], type:'quiz', title:'Quiz result available', message:`${quiz.title}: ${score}/${totalMarks}`, link:`/lms/quizzes/${quiz._id}` })
    await notifications.notifyParents([req.user._id], { type:'quiz', title:'Quiz result available', message:`${quiz.title}: ${score}/${totalMarks}`, link:`/lms/quizzes/${quiz._id}` })
    res.json({ message:'Quiz submitted', data })
  } catch (e) { fail(res, e.message, 400) }
}
exports.attempts = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course')
    if (!quiz) return fail(res, 'Quiz not found', 404)
    if (!admin(req.user) && String(quiz.course.instructor) !== String(req.user._id) && String(quiz.course.createdBy) !== String(req.user._id)) return fail(res, 'Forbidden', 403)
    res.json({ data: await QuizAttempt.find({ quiz: quiz._id }).populate('student','name email grade').sort('-submittedAt') })
  } catch (e) { fail(res, e.message) }
}
exports.remove = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course')
    if (!quiz) return fail(res, 'Quiz not found', 404)
    if (!admin(req.user) && String(quiz.course.instructor) !== String(req.user._id) && String(quiz.course.createdBy) !== String(req.user._id)) return fail(res, 'Forbidden', 403)
    await QuizAttempt.deleteMany({ quiz: quiz._id })
    await quiz.deleteOne()
    res.json({ message: 'Quiz deleted' })
  } catch (e) { fail(res, e.message, 400) }
}
