const { User, ParentStudent, AcademicClass, AcademicSession, Enrollment, Teacher } = require('../models')
const mongoose = require('mongoose')
const fail = (res, message, code = 400) => res.status(code).json({ message })
const id = value => mongoose.isValidObjectId(value)
exports.linkParent = async (req, res) => {
  try {
    if (!id(req.body.parent) || !id(req.body.student)) return fail(res, 'Valid parent and student IDs are required')
    const [parent, student] = await Promise.all([User.findOne({ _id: req.body.parent, role: 'parent' }), User.findOne({ _id: req.body.student, role: 'student' })])
    if (!parent || !student) return fail(res, 'Parent and student accounts are required')
    res.status(201).json({ data: await ParentStudent.findOneAndUpdate({ parent: parent._id, student: student._id }, { relationship: req.body.relationship || 'Parent', isActive: true }, { upsert: true, new: true, setDefaultsOnInsert: true }) })
  } catch (e) { fail(res, e.message) }
}
exports.children = async (req, res) => {
  try { res.json({ data: await ParentStudent.find({ parent: req.user._id, isActive: true }).populate('student', 'name email grade') }) }
  catch (e) { fail(res, e.message, 500) }
}
exports.unlinkParent = async (req, res) => {
  try {
    if (!id(req.body.parent) || !id(req.body.student)) return fail(res, 'Valid parent and student IDs are required')
    const result = await ParentStudent.findOneAndDelete({ parent:req.body.parent, student:req.body.student })
    if (!result) return fail(res, 'Relationship not found', 404)
    res.json({ message:'Relationship removed' })
  } catch (e) { fail(res, e.message) }
}
exports.enroll = async (req, res) => {
  try {
    if (!id(req.body.student) || !id(req.body.academicClass) || !id(req.body.session)) return fail(res, 'Valid student, class, and session IDs are required')
    const [student, academicClass, session] = await Promise.all([User.findOne({ _id: req.body.student, role: 'student' }), AcademicClass.findById(req.body.academicClass), AcademicSession.findById(req.body.session)])
    if (!student || !academicClass || !session) return fail(res, 'Valid student, class, and session are required')
    res.status(201).json({ data: await Enrollment.findOneAndUpdate({ student: student._id, session: session._id }, { academicClass: academicClass._id, section: req.body.section, status: req.body.status || 'active' }, { upsert: true, new: true, setDefaultsOnInsert: true }).populate('student academicClass session') })
  } catch (e) { fail(res, e.message) }
}
exports.listEnrollments = async (req, res) => {
  try {
    for (const value of [req.query.student, req.query.academicClass, req.query.session]) {
      if (value && !id(value)) return fail(res, 'Invalid enrollment filter')
    }
    const filter = {}
    if (req.query.student) filter.student = req.query.student
    if (req.query.academicClass) filter.academicClass = req.query.academicClass
    if (req.query.session) filter.session = req.query.session
    res.json({ data: await Enrollment.find(filter).populate('student', 'name email grade').populate('academicClass', 'name sections').populate('session', 'name').sort('-createdAt') })
  } catch (e) { fail(res, e.message, 500) }
}
exports.listClasses = async (req, res) => res.json({ data: await AcademicClass.find({ isActive: true }).sort('name') })
exports.listSessions = async (req, res) => res.json({ data: await AcademicSession.find().sort('-startsOn') })
exports.createClass = async (req, res) => {
  try {
    if (!req.body.name?.trim()) return fail(res, 'Class name is required')
    res.status(201).json({ data: await AcademicClass.create({ name:req.body.name, sections:req.body.sections || [] }) })
  } catch (e) { fail(res, e.message) }
}
exports.createSession = async (req, res) => {
  try {
    if (!req.body.name || !req.body.startsOn || !req.body.endsOn) return fail(res, 'Session name and dates are required')
    if (new Date(req.body.endsOn) <= new Date(req.body.startsOn)) return fail(res, 'Session end must be after its start')
    if (req.body.isCurrent) await AcademicSession.updateMany({}, { isCurrent:false })
    res.status(201).json({ data: await AcademicSession.create(req.body) })
  } catch (e) { fail(res, e.message) }
}
exports.linkTeacher = async (req, res) => {
  try {
    if (!id(req.body.user) || !id(req.body.teacher)) return fail(res, 'Valid teacher IDs are required')
    const [user, teacher] = await Promise.all([User.findOne({ _id: req.body.user, role: 'teacher' }), Teacher.findById(req.body.teacher)])
    if (!user || !teacher) return fail(res, 'Valid teacher user and public teacher record are required')
    user.teacherProfile = teacher._id; await user.save()
    res.json({ data: user })
  } catch (e) { fail(res, e.message) }
}
