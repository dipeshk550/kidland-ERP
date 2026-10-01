const { AttendanceRecord, Enrollment, User, ParentStudent, Notification } = require('../models')

const dayKey = value => new Date(value).toISOString().slice(0, 10)

/**
 * Calculates from persisted records only. `notify` is deliberately opt-in so
 * scheduled jobs can call this service without unexpectedly sending messages.
 * Existing notifications are checked before insertion, making reruns safe.
 */
exports.findLowAttendance = async ({ from, to, threshold = 75, minDays = 1, studentIds } = {}) => {
  const start = new Date(from || new Date(new Date().getFullYear(), 0, 1))
  const end = new Date(to || new Date())
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new Error('Invalid attendance report range')
  const limit = Math.max(0, Math.min(100, Number(threshold) || 75))
  const minimum = Math.max(1, Math.min(366, Number(minDays) || 1))
  const enrollmentFilter = { status: 'active', student: studentIds ? { $in: studentIds } : { $exists: true } }
  const enrollments = await Enrollment.find(enrollmentFilter).populate('student', 'name email role isActive').populate('academicClass', 'name').populate('session', 'name')
  const ids = enrollments.map(row => row.student?._id).filter(Boolean)
  if (!ids.length) return []
  const rows = await AttendanceRecord.find({
    person: { $in: ids }, personType: 'student',
    date: { $gte: start, $lte: end }, mode: 'daily',
    status: { $in: ['present', 'absent', 'late', 'leave'] },
  }).select('person dateKey status')
  const byStudent = new Map()
  rows.forEach(row => {
    const item = byStudent.get(String(row.person)) || { present: 0, total: 0, leave: 0 }
    if (row.status === 'leave') item.leave++
    else {
      item.total++
      if (['present', 'late'].includes(row.status)) item.present++
    }
    byStudent.set(String(row.person), item)
  })
  return enrollments.map(enrollment => {
    const stats = byStudent.get(String(enrollment.student._id)) || { present: 0, total: 0, leave: 0 }
    const percentage = stats.total ? +(stats.present * 100 / stats.total).toFixed(2) : 100
    return { enrollment, stats, percentage }
  }).filter(item => item.stats.total >= minimum && item.percentage < limit)
}

exports.notifyLowAttendance = async ({ from, to, threshold, minDays, studentIds } = {}) => {
  const alerts = await exports.findLowAttendance({ from, to, threshold, minDays, studentIds })
  const links = alerts.length
    ? await ParentStudent.find({ student: { $in: alerts.map(item => item.enrollment.student._id) }, isActive: true }).select('parent student')
    : []
  const created = []
  for (const alert of alerts) {
    const parents = links.filter(link => String(link.student) === String(alert.enrollment.student._id))
    const title = 'Low attendance alert'
    const message = `${alert.enrollment.student.name} attendance is ${alert.percentage}% for the selected period.`
    for (const parent of parents) {
      const exists = await Notification.exists({
        recipient: parent.parent, type: 'system', title, message,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
      if (!exists) created.push(await Notification.create({ recipient: parent.parent, type: 'system', title, message, link: '/parent/attendance' }))
    }
  }
  return { alerts, notificationsCreated: created.length }
}
