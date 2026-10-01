const { Notification, ParentStudent } = require('../models')

exports.notify = async ({ recipients = [], type, title, message, link }) => {
  const ids = [...new Set(recipients.map(String).filter(Boolean))]
  if (!ids.length) return []
  const rows = await Notification.insertMany(ids.map(recipient => ({ recipient, type, title, message, link })))
  return rows
}
exports.notifyParents = async (studentIds, payload) => {
  const links = await ParentStudent.find({ student: { $in: studentIds }, isActive: true }).select('parent')
  return exports.notify({ ...payload, recipients: links.map(row => row.parent) })
}
exports.courseStudents = async course => {
  const { User, Enrollment, AcademicSession } = require('../models')
  const session = course.session || (await AcademicSession.findOne({ isCurrent:true }))?._id
  if (course.academicClass && session) {
    const rows = await Enrollment.find({ academicClass:course.academicClass, session, status:'active' }).select('student')
    return rows.map(row => row.student)
  }
  return (await User.find({ role:'student', grade:course.grade, isActive:true }).select('_id')).map(row => row._id)
}
