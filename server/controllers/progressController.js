const { Course, Lesson, LessonProgress, Assignment, Submission, Quiz, QuizAttempt, ParentStudent, AcademicSession, Enrollment, User } = require('../models')
const courseFilterFor = async user => {
  const session = await AcademicSession.findOne({ isCurrent:true }).select('_id')
  const rows = session && await Enrollment.find({ student:user._id, session:session._id, status:'active' }).select('academicClass')
  return rows?.length ? { status:'published', academicClass:{ $in:rows.map(row=>row.academicClass) } } : { status:'published', grade:user.grade }
}
exports.mine = async (req, res) => {
  try {
    const courses = await Course.find(await courseFilterFor(req.user)).lean()
    const data = await Promise.all(courses.map(async course => {
      const [lessonRows, assignmentRows, quizRows] = await Promise.all([
        Lesson.find({ course:course._id, status:'published', visibility:'visible' }).select('_id title'),
        Assignment.find({ course:course._id, status:'published' }).select('_id title maxMarks'),
        Quiz.find({ course:course._id, status:'published' }).select('_id title'),
      ])
      const [completedLessons, submissions, attempts] = await Promise.all([
        LessonProgress.countDocuments({ student:req.user._id, lesson:{ $in:lessonRows.map(row => row._id) } }),
        Submission.find({ student:req.user._id, assignment:{ $in:assignmentRows.map(row => row._id) } }).select('assignment marks feedback status').populate('assignment', 'title maxMarks'),
        QuizAttempt.find({ student:req.user._id, quiz:{ $in:quizRows.map(row => row._id) } }).select('quiz score totalMarks submittedAt').populate('quiz', 'title'),
      ])
      const lessons = lessonRows.length, assignments = assignmentRows.length, quizzes = quizRows.length
      const total = lessons + assignments + quizzes
      const submittedByAssignment = new Map(submissions.map(row => [String(row.assignment?._id || row.assignment), row]))
      const assignmentResults = assignmentRows.map(assignment => ({
        assignment,
        ...(submittedByAssignment.get(String(assignment._id)) || { status: 'pending', marks: null, feedback: '' }),
      }))
      return { course, lessons, assignments, quizzes, completedLessons, completed: completedLessons + submissions.length + attempts.length, percent: total ? Math.round(((completedLessons + submissions.length + attempts.length) / total) * 100) : 0, assignmentResults, quizResults: attempts }
    }))
    res.json({ data })
  } catch (e) { res.status(500).json({ message:e.message }) }
}
exports.parent = async (req, res) => {
  try {
    const links = await ParentStudent.find({ parent:req.user._id, isActive:true }).select('student')
    const data = await Promise.all(links.map(async link => {
      const student = await User.findById(link.student).select('name email grade')
      const response = await exports._mineFor(student)
      return { student, courses: response }
    }))
    res.json({ data })
  } catch (e) { res.status(500).json({ message:e.message }) }
}
exports._mineFor = async user => {
  const courses = await Course.find(await courseFilterFor(user)).lean()
  return Promise.all(courses.map(async course => {
    const [lessonRows, assignmentRows, quizRows] = await Promise.all([
      Lesson.find({course:course._id,status:'published',visibility:'visible'}).select('_id title'),
      Assignment.find({course:course._id,status:'published'}).select('_id title maxMarks'),
      Quiz.find({course:course._id,status:'published'}).select('_id title'),
    ])
    const [completedLessons, submissions, attempts] = await Promise.all([
      LessonProgress.countDocuments({student:user._id,lesson:{$in:lessonRows.map(row=>row._id)}}),
      Submission.find({student:user._id,assignment:{$in:assignmentRows.map(row=>row._id)}}).select('assignment marks feedback status').populate('assignment', 'title maxMarks'),
      QuizAttempt.find({student:user._id,quiz:{$in:quizRows.map(row=>row._id)}}).select('quiz score totalMarks submittedAt').populate('quiz', 'title'),
    ])
    const lessons=lessonRows.length, assignments=assignmentRows.length, quizzes=quizRows.length
    const total=lessons+assignments+quizzes
    const submittedByAssignment = new Map(submissions.map(row => [String(row.assignment?._id || row.assignment), row]))
    const assignmentResults = assignmentRows.map(assignment => ({
      assignment,
      ...(submittedByAssignment.get(String(assignment._id)) || { status: 'pending', marks: null, feedback: '' }),
    }))
    return { course, lessons, assignments, quizzes, completedLessons, completed:completedLessons+submissions.length+attempts.length, percent:total?Math.round((completedLessons+submissions.length+attempts.length)/total*100):0, assignmentResults, quizResults:attempts }
  }))
}
exports.completeLesson = async (req, res) => {
  try {
    const course = await Course.findOne({ _id:req.params.courseId, ...(await courseFilterFor(req.user)) })
    const lesson = course && await Lesson.findOne({ _id:req.params.lessonId, course:course._id, status:'published', visibility:'visible' })
    if (!lesson) return res.status(404).json({ message:'Lesson not found' })
    const position = req.body.positionSeconds === undefined ? undefined : Number(req.body.positionSeconds)
    const spent = req.body.timeSpentSeconds === undefined ? undefined : Number(req.body.timeSpentSeconds)
    if ([position, spent].some(value => value !== undefined && (!Number.isFinite(value) || value < 0))) return res.status(400).json({ message:'Progress time values must be non-negative numbers' })
    const updates = { completedAt:new Date() }
    if (position !== undefined) updates.lastPositionSeconds = position
    if (spent !== undefined) updates.timeSpentSeconds = spent
    const data = await LessonProgress.findOneAndUpdate({ student:req.user._id, lesson:lesson._id }, updates, { upsert:true, new:true, setDefaultsOnInsert:true })
    res.json({ message:'Lesson marked complete', data })
  } catch (e) { res.status(400).json({ message:e.message }) }
}
exports.studentReport = async (req, res) => {
  try {
    const students = req.query.student ? await User.find({ _id:req.query.student, role:'student' }).select('name email grade') : await User.find({ role:'student', isActive:true }).select('name email grade').sort('name')
    const data = await Promise.all(students.map(async student => ({ student, courses: (await exports._mineFor(student)).filter(item => (!req.query.course || String(item.course._id) === String(req.query.course)) && (!req.query.status || item.course.status === req.query.status)) })))
    res.json({ data })
  } catch (e) { res.status(500).json({ message:e.message }) }
}
exports.report = async (req, res) => {
  try {
    const courseFilter = {}
    if (req.query.course) courseFilter._id = req.query.course
    if (req.query.status) courseFilter.status = req.query.status
    const courseIds = await Course.find(courseFilter).distinct('_id')
    const [courses, assignments, submissions, quizzes, attempts, publishedCourses] = await Promise.all([
      Course.countDocuments(courseFilter),
      Assignment.countDocuments({ course:{ $in:courseIds } }),
      Submission.countDocuments({ assignment:{ $in:await Assignment.find({ course:{ $in:courseIds } }).distinct('_id') } }),
      Quiz.countDocuments({ course:{ $in:courseIds } }),
      QuizAttempt.countDocuments({ quiz:{ $in:await Quiz.find({ course:{ $in:courseIds } }).distinct('_id') } }),
      Course.countDocuments({ ...courseFilter, status:'published' }),
    ])
    const since = new Date()
    since.setMonth(since.getMonth() - 5, 1)
    const [submissionTrend, attemptTrend] = await Promise.all([
      Submission.aggregate([{ $match:{ assignment:{ $in:await Assignment.find({ course:{ $in:courseIds } }).distinct('_id') }, createdAt:{ $gte:since } } }, { $group:{ _id:{ $dateToString:{ format:'%Y-%m', date:'$createdAt' } }, count:{ $sum:1 } } }, { $sort:{ _id:1 } }]),
      QuizAttempt.aggregate([{ $match:{ quiz:{ $in:await Quiz.find({ course:{ $in:courseIds } }).distinct('_id') }, createdAt:{ $gte:since } } }, { $group:{ _id:{ $dateToString:{ format:'%Y-%m', date:'$createdAt' } }, count:{ $sum:1 } } }, { $sort:{ _id:1 } }]),
    ])
    res.json({ data:{ courses, publishedCourses, assignments, submissions, quizzes, attempts, trends:{ submissions:submissionTrend, attempts:attemptTrend }, filters:{ course:req.query.course || null, status:req.query.status || null } } })
  } catch (e) { res.status(500).json({ message:e.message }) }
}
