const mongoose = require('mongoose')
const {
  User, Enrollment, ParentStudent, AttendanceRecord, TimetableEntry,
  TimetableOverride, AttendanceRule, LeaveRequest, AuditLog,
  AcademicClass, AcademicSession,
  Course,
} = require('../models')
const { notifyParents } = require('../services/notificationService')
const lowAttendanceService = require('../services/lowAttendanceService')

const bad = (res, message, code = 400) => res.status(code).json({ message })
const id = value => mongoose.isValidObjectId(value)
const key = value => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}
const isManager = user => ['superadmin', 'admin', 'coadmin'].includes(user.role)
const audit = (req, action, entity, entityId, details) =>
  AuditLog.create({ actor: req.user._id, action, entity, entityId, details, ip: req.ip })

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'leave']
const isTeacher = user => user.role === 'teacher'
const timeValue = value => {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim()
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : false
}

const dateRange = (from, to) => {
  const start = key(from)
  const end = key(to || from)
  if (!start || !end || start > end) return null
  return { start, end }
}

async function teacherIds(req, requested) {
  if (isTeacher(req.user)) return [req.user._id]
  if (!isManager(req.user)) return null
  if (requested !== undefined) {
    if (!id(requested)) return null
    const teacher = await User.findOne({ _id: requested, role: 'teacher', isActive: true }).select('_id name email')
    return teacher ? [teacher._id] : null
  }
  return (await User.find({ role: 'teacher', isActive: true }).select('_id name email').sort('name')).map(user => user._id)
}

async function teacherReport(req, from, to, requested) {
  const range = dateRange(from, to)
  if (!range) return { error: 'Valid from and to dates are required' }
  const people = await teacherIds(req, requested)
  if (!people) return { error: 'Invalid or unavailable teacher', forbidden: isTeacher(req.user) || !isManager(req.user) }
  const rows = await AttendanceRecord.find({
    person: { $in: people }, personType: 'teacher',
    dateKey: { $gte: range.start, $lte: range.end },
  }).sort('dateKey period').populate('person', 'name email role')
  const data = people.map(person => {
    const records = rows.filter(row => String(row.person._id || row.person) === String(person))
    return {
      teacher: records[0]?.person || person,
      total: records.length,
      counts: Object.fromEntries(ATTENDANCE_STATUSES.map(status => [status, records.filter(row => row.status === status).length])),
      records,
    }
  })
  return { from: range.start, to: range.end, data }
}

async function teacherContext(req, values = {}) {
  if (!isTeacher(req.user) && !isManager(req.user)) return null
  const filter = { status: 'active' }
  if (isTeacher(req.user)) filter.teacher = req.user._id
  ;['academicClass', 'section', 'session', 'subject'].forEach(field => {
    if (values[field] !== undefined) filter[field] = values[field]
  })
  if (values.period !== undefined) filter.period = Number(values.period)
  if (values.timetableId) {
    if (!id(values.timetableId)) return null
    filter._id = values.timetableId
  }
  return TimetableEntry.findOne(filter)
}

async function studentEnrollment(student, academicClass, session, section) {
  return Enrollment.findOne({
    student, academicClass, session, ...(section ? { section } : {}), status: 'active',
  })
}

async function canSeePerson(req, personId) {
  if (isManager(req.user)) return true
  if (String(req.user._id) === String(personId)) return true
  if (req.user.role === 'parent')
    return !!await ParentStudent.exists({ parent: req.user._id, student: personId, isActive: true })
  if (req.user.role === 'teacher')
    return !!await Enrollment.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(personId), status: 'active' } },
      { $lookup: { from: 'timetableentries', localField: 'academicClass', foreignField: 'academicClass', as: 'classes' } },
      { $unwind: '$classes' },
      { $match: { 'classes.teacher': req.user._id, 'classes.status': 'active' } },
      { $limit: 1 },
    ]).then(rows => rows.length > 0)
  return false
}

async function scopedPersonIds(req) {
  if (isManager(req.user)) return null
  if (req.user.role === 'student') return [req.user._id]
  if (req.user.role === 'parent') {
    const links = await ParentStudent.find({ parent: req.user._id, isActive: true }).select('student')
    return links.map(link => link.student)
  }
  if (req.user.role === 'teacher') {
    const entries = await TimetableEntry.find({ teacher: req.user._id, status: 'active' }).select('academicClass session')
    if (!entries.length) return [req.user._id]
    const clauses = entries.map(entry => ({ academicClass: entry.academicClass, session: entry.session }))
    const enrollments = await Enrollment.find({ $or: clauses, status: 'active' }).select('student')
    return [...new Map([...enrollments.map(row => [String(row.student), row.student]), [String(req.user._id), req.user._id]]).values()]
  }
  return [req.user._id]
}

async function scopedTimetableFilter(req, filter = {}) {
  if (isManager(req.user)) return filter
  if (req.user.role === 'teacher') return { ...filter, teacher: req.user._id }
  const enrollments = req.user.role === 'parent'
    ? await (async () => {
        const links = await ParentStudent.find({ parent: req.user._id, isActive: true }).select('student')
        return Enrollment.find({ student: { $in: links.map(link => link.student) }, status: 'active' }).select('academicClass section session')
      })()
    : await Enrollment.find({ student: req.user._id, status: 'active' }).select('academicClass section session')
  if (!enrollments.length) return { ...filter, _id: { $in: [] } }
  return {
    ...filter,
    $or: enrollments.map(enrollment => ({
      academicClass: enrollment.academicClass,
      ...(enrollment.section ? { section: enrollment.section } : {}),
      session: enrollment.session,
    })),
  }
}

exports.listAttendance = async (req, res) => {
  try {
    const filter = {}
    if (req.query.date) { filter.dateKey = key(req.query.date); if (!filter.dateKey) return bad(res, 'Invalid date') }
    if (req.query.from || req.query.to) {
      filter.date = {}
      if (req.query.from) filter.date.$gte = new Date(req.query.from)
      if (req.query.to) filter.date.$lte = new Date(`${req.query.to}T23:59:59.999Z`)
    }
    ;['person','academicClass','session','section','mode','status'].forEach(k => {
      if (req.query[k]) filter[k] = req.query[k]
    })
    if (!isManager(req.user)) {
      if (req.user.role === 'parent') {
        const links = await ParentStudent.find({ parent: req.user._id, isActive: true }).select('student')
        filter.person = { $in: links.map(x => x.student) }
      } else filter.person = req.user._id
    }
    const rows = await AttendanceRecord.find(filter).sort({ date: -1, period: 1 })
      .limit(Math.min(Number(req.query.limit) || 500, 1000))
      .populate('person', 'name email role').populate('academicClass', 'name')
    res.json({ data: rows })
  } catch (e) { res.status(500).json({ message: e.message }) }
}

exports.upsertAttendance = async (req, res) => {
  try {
    const b = req.body || {}
    if (!id(b.person) || !['student','teacher','staff'].includes(b.personType)) return bad(res, 'Valid person and person type are required')
    const dateKey = key(b.date)
    if (!dateKey || !['present','absent','late','leave'].includes(b.status)) return bad(res, 'Valid date and attendance status are required')
    const target = await User.findById(b.person).select('role isActive')
    if (!target || !target.isActive || target.role !== b.personType) return bad(res, 'Person does not match the supplied person type')
    if (!isManager(req.user) && req.user.role === 'teacher' && b.personType !== 'student') return bad(res, 'Teachers can record students only', 403)
    if (!isManager(req.user) && !await canSeePerson(req, b.person)) return bad(res, 'Attendance is outside your scope', 403)
    const filter = { person: b.person, dateKey, mode: b.mode || 'daily', period: b.period || undefined }
    const old = await AttendanceRecord.findOne(filter)
    if (old?.lockedAt && !isManager(req.user)) return bad(res, 'This attendance record is locked', 409)
    if (old?.lockedAt && !b.correctionReason) return bad(res, 'A correction reason is required for locked records')
    const rule = await AttendanceRule.findOne({ isActive: true }).sort('-createdAt')
    const lateMinutes = Number(b.lateMinutes) || 0
    const data = {
      person: b.person, personType: b.personType, enrollment: id(b.enrollment) ? b.enrollment : undefined,
      academicClass: id(b.academicClass) ? b.academicClass : undefined, section: b.section,
      session: id(b.session) ? b.session : undefined, date: new Date(`${dateKey}T00:00:00.000Z`),
      dateKey, mode: b.mode || 'daily', period: b.period, subject: b.subject,
      status: b.status === 'present' && rule && lateMinutes > rule.lateAfterMinutes ? 'late' : b.status,
      lateMinutes, source: b.source || 'manual',
      correctionReason: b.correctionReason, correctionOf: old?._id,
      recordedBy: req.user._id, remarks: b.remarks,
    }
    const row = await AttendanceRecord.findOneAndUpdate(filter, data, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true })
    await audit(req, old ? 'edit' : 'create', 'attendance', row._id, { dateKey, status: row.status, person: row.person })
    if (row.personType === 'student' && ['absent','late'].includes(row.status))
      await notifyParents([row.person], { type: 'system', title: 'Attendance update', message: `${row.personType} marked ${row.status} on ${dateKey}`, link: '/parent' })
    res.status(old ? 200 : 201).json({ data: row })
  } catch (e) { res.status(e.code === 11000 ? 409 : 400).json({ message: e.message }) }
}

exports.teacherClasses = async (req, res) => {
      if (!isTeacher(req.user) && !isManager(req.user)) return bad(res, 'Teachers or authorised administrators only', 403)
      const today = new Date()
      const day = today.getDay()
      const teacherFilter = isManager(req.user) ? { status:'active' } : { teacher:req.user._id, status:'active' }
      const rows = await TimetableEntry.find(teacherFilter)
        .populate('academicClass', 'name').populate('session', 'name')
        .sort('dayOfWeek period')
      const result = rows.map(row => {
        const completed = row.dayOfWeek === day && row.period < (Number(req.query.currentPeriod) || 0)
        const todayClass = row.dayOfWeek === day
        return { ...row.toObject(), bucket: todayClass ? (completed ? 'completed' : 'today') : (row.dayOfWeek > day ? 'upcoming' : 'pending') }
      })
      res.json({ data: result })
    }

    exports.setup = async (req, res) => {
      if (!isManager(req.user)) return bad(res, 'Authorised administrators only', 403)
      const [classes, sessions, teachers, courseSubjects, timetableSubjects] = await Promise.all([
        require('../models').AcademicClass.find({ isActive:true }).sort('name'),
          require('../models').AcademicSession.find().sort('-isCurrent -startsOn'),
        User.find({ role:'teacher', isActive:true }).select('name email').sort('name'),
        Course.distinct('subject', { subject: { $exists:true, $nin:['', null] } }),
        TimetableEntry.distinct('subject', { subject: { $exists:true, $nin:['', null] } }),
      ])
        const subjects = [...new Set([...courseSubjects, ...timetableSubjects].map(value => String(value).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
        res.json({ data:{ classes, sessions, teachers, subjects, currentSession: sessions.find(session => session.isCurrent) || sessions[0] || null } })
    }

    exports.teacherRoster = async (req, res) => {
      if (!isTeacher(req.user) && !isManager(req.user)) return bad(res, 'Teachers or authorised administrators only', 403)
      const context = await teacherContext(req, req.query)
      if (!context) return bad(res, 'Timetable context is not assigned to this teacher', 403)
      const enrollments = await Enrollment.find({
        academicClass:context.academicClass, session:context.session, section:context.section, status:'active',
      }).populate('student', 'name email grade')
      const dateKey = key(req.query.date || new Date())
      const existing = await AttendanceRecord.find({
        person: { $in: enrollments.map(row => row.student._id) }, dateKey,
        mode:'period', period:context.period, subject:context.subject,
      }).select('person status lateMinutes remarks')
      const records = new Map(existing.map(row => [String(row.person), row]))
      const leaves = await LeaveRequest.find({
        applicant: { $in: enrollments.map(row => row.student._id) }, status:'approved',
        fromDate: { $lte:new Date(`${dateKey}T23:59:59.999Z`) },
        toDate: { $gte:new Date(`${dateKey}T00:00:00.000Z`) },
      }).select('applicant')
      const leaveIds = new Set(leaves.map(row => String(row.applicant)))
      res.json({ data: enrollments.map(enrollment => {
        const record = records.get(String(enrollment.student._id))
        return {
          enrollment: enrollment._id, student: enrollment.student, status: record?.status || (leaveIds.has(String(enrollment.student._id)) ? 'leave' : 'present'),
          lateMinutes: record?.lateMinutes || 0, remarks: record?.remarks || '', approvedLeave: leaveIds.has(String(enrollment.student._id)),
        }
      }), context })
    }

    exports.batchAttendance = async (req, res) => {
      try {
        if (!isTeacher(req.user) && !isManager(req.user)) return bad(res, 'Teachers or authorised administrators only', 403)
        const b = req.body || {}
        const dateKey = key(b.date)
        if (!dateKey || !id(b.academicClass) || !id(b.session) || !b.section || !b.subject || !Number.isInteger(Number(b.period)) || !Array.isArray(b.records)) return bad(res, 'Class, section, subject, date, period and records are required')
        const context = await teacherContext(req, b)
        if (!context) return bad(res, 'Teacher is not assigned to this timetable context', 403)
        const studentIds = b.records.map(row => row.student).filter(id)
        const enrollments = await Enrollment.find({ student:{ $in:studentIds }, academicClass:b.academicClass, session:b.session, section:b.section, status:'active' }).select('student')
        const allowed = new Set(enrollments.map(row => String(row.student)))
        if (allowed.size !== studentIds.length) return bad(res, 'One or more students are outside this class scope', 403)
        const approved = await LeaveRequest.find({ applicant:{ $in:studentIds }, status:'approved', fromDate:{ $lte:new Date(`${dateKey}T23:59:59.999Z`) }, toDate:{ $gte:new Date(`${dateKey}T00:00:00.000Z`) } }).select('applicant')
        const approvedIds = new Set(approved.map(row => String(row.applicant)))
        const results = []
        for (const record of b.records) {
          const requested = record.status || 'present'
          if (!ATTENDANCE_STATUSES.includes(requested)) return bad(res, 'Only present, absent, late and leave statuses are allowed')
          const status = approvedIds.has(String(record.student)) ? 'leave' : requested
          const filter = { person:record.student, dateKey, mode:'period', period:Number(b.period), subject:b.subject }
          const row = await AttendanceRecord.findOneAndUpdate(filter, {
            person:record.student, personType:'student', enrollment:enrollments.find(item => String(item.student) === String(record.student))?._id,
            academicClass:b.academicClass, section:b.section, session:b.session, date:new Date(`${dateKey}T00:00:00.000Z`),
            dateKey, mode:'period', period:Number(b.period), subject:b.subject, status,
            lateMinutes:status === 'late' ? Math.max(0, Number(record.lateMinutes) || 0) : 0,
            source:'manual', recordedBy:req.user._id, remarks:record.remarks,
          }, { upsert:true, new:true, runValidators:true })
          results.push(row)
        }
        await audit(req, 'batch-create', 'attendance', undefined, { academicClass:b.academicClass, section:b.section, subject:b.subject, dateKey, period:b.period, count:results.length })
        res.json({ data:results, count:results.length })
      } catch (e) { res.status(e.code === 11000 ? 409 : 400).json({ message:e.message }) }
    }

    exports.studentAttendanceSummary = async (req, res) => {
      try {
        if (!id(req.params.student)) return bad(res, 'Invalid student')
        if (!await canSeePerson(req, req.params.student)) return bad(res, 'Attendance is outside your scope', 403)
        const month = Number(req.query.month) || new Date().getMonth() + 1
        const year = Number(req.query.year) || new Date().getFullYear()
        if (month < 1 || month > 12 || year < 2000 || year > 2200) return bad(res, 'Invalid month or year')
        const from = new Date(Date.UTC(year, month - 1, 1)), to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        const rows = await AttendanceRecord.find({ person:req.params.student, date:{ $gte:from, $lte:to } }).sort('date period')
        const counts = Object.fromEntries(ATTENDANCE_STATUSES.map(status => [status, rows.filter(row => row.status === status).length]))
        res.json({ student:req.params.student, month, year, counts, total:rows.length, data:rows })
      } catch (e) { res.status(400).json({ message:e.message }) }
    }

    exports.myAttendanceSummary = async (req, res) => {
      const people = req.user.role === 'parent'
        ? (await ParentStudent.find({ parent:req.user._id, isActive:true }).select('student')).map(row => row.student)
        : [req.user._id]
      const month = Number(req.query.month) || new Date().getMonth() + 1
      const year = Number(req.query.year) || new Date().getFullYear()
      if (month < 1 || month > 12 || year < 2000 || year > 2200) return bad(res, 'Invalid month or year')
      const from = new Date(Date.UTC(year, month - 1, 1)), to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
      const rows = await AttendanceRecord.find({ person:{ $in:people }, date:{ $gte:from, $lte:to } }).populate('person','name email')
      const data = people.map(person => {
        const own = rows.filter(row => String(row.person._id || row.person) === String(person))
        return { person: own[0]?.person || person, total:own.length, counts:Object.fromEntries(ATTENDANCE_STATUSES.map(status => [status, own.filter(row => row.status === status).length])) }
      })
      res.json({ month, year, data })
    }

exports.lockAttendance = async (req, res) => {
  const row = await AttendanceRecord.findById(req.params.id)
  if (!row) return bad(res, 'Attendance record not found', 404)
  if (row.lockedAt) return res.json({ data: row })
  row.lockedAt = new Date(); row.lockedBy = req.user._id; await row.save()
  await audit(req, 'lock', 'attendance', row._id, {})
  res.json({ data: row })
}

exports.dashboard = async (req, res) => {
  try {
    const dateKey = key(req.query.date || new Date())
    const match = { dateKey }
    if (req.query.academicClass && id(req.query.academicClass)) match.academicClass = req.query.academicClass
    const people = await scopedPersonIds(req)
    if (people) match.person = { $in: people }
    const grouped = await AttendanceRecord.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }])
    const total = grouped.reduce((n, x) => n + x.count, 0)
    res.json({ date: dateKey, total, counts: Object.fromEntries(grouped.map(x => [x._id, x.count])) })
  } catch (e) { res.status(500).json({ message: e.message }) }
}

exports.report = async (req, res) => {
  try {
    const from = key(req.query.from || new Date()); const to = key(req.query.to || from)
    if (!from || !to) return bad(res, 'Valid from and to dates are required')
    const people = await scopedPersonIds(req)
    const match = { dateKey: { $gte: from, $lte: to } }
    if (people) match.person = { $in: people }
    if (req.query.academicClass && id(req.query.academicClass)) match.academicClass = req.query.academicClass
    if (req.query.section) match.section = String(req.query.section).trim()
    if (req.query.status && ATTENDANCE_STATUSES.includes(req.query.status)) match.status = req.query.status
    if (req.query.mode && ['daily', 'period'].includes(req.query.mode)) match.mode = req.query.mode
    const rows = await AttendanceRecord.aggregate([
      { $match: match },
      { $group: { _id: { date: '$dateKey', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } },
    ])
    res.json({ from, to, data: rows })
  } catch (e) { res.status(500).json({ message: e.message }) }
}

exports.listRules = async (req, res) => res.json({ data: await AttendanceRule.find().sort('-createdAt') })
exports.createRule = async (req, res) => {
  try {
    const b = req.body || {}
    if (!b.name) return bad(res, 'Rule name is required')
    const row = await AttendanceRule.create({ name:b.name, lateAfterMinutes:Number(b.lateAfterMinutes)||0, autoLockAfterHours:Number(b.autoLockAfterHours)||24, notifyParentOnAbsence:!!b.notifyParentOnAbsence, isActive:b.isActive !== false, createdBy:req.user._id })
    await audit(req, 'create', 'attendance-rule', row._id, { name:row.name })
    res.status(201).json({ data:row })
  } catch (e) { res.status(400).json({ message:e.message }) }
}
exports.updateRule = async (req, res) => {
  try {
    const allowed = ['name','lateAfterMinutes','autoLockAfterHours','notifyParentOnAbsence','isActive']
    const patch = {}; allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k] })
    const row = await AttendanceRule.findByIdAndUpdate(req.params.id, patch, { new:true, runValidators:true })
    if (!row) return bad(res, 'Rule not found', 404)
    await audit(req, 'edit', 'attendance-rule', row._id, patch)
    res.json({ data:row })
  } catch (e) { res.status(400).json({ message:e.message }) }
}

async function loadTeacherSchedule(req, dateKey) {
  const dayOfWeek = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay()
  const teachers = await teacherIds(req, req.query.teacher)
  if (!teachers) return null
  const filter = { teacher: { $in: teachers }, dayOfWeek, status: 'active' }
  if (req.query.session) {
    if (!id(req.query.session)) return { invalidSession: true }
    filter.session = req.query.session
  }
  const entries = await TimetableEntry.find(filter).sort('period')
    .populate('academicClass', 'name sections').populate('session', 'name startsOn endsOn')
    .populate('teacher', 'name email')
  const overrides = await TimetableOverride.find({
    entry: { $in: entries.map(entry => entry._id) },
    date: new Date(`${dateKey}T00:00:00.000Z`), status: 'active',
  }).populate('substituteTeacher', 'name email')
  const overrideByEntry = new Map(overrides.map(override => [String(override.entry), override]))
  return {
    dayOfWeek,
    data: entries.map(entry => {
      const override = overrideByEntry.get(String(entry._id))
      const row = entry.toObject()
      if (override) {
        row.override = override
        if (override.substituteTeacher) row.teacher = override.substituteTeacher
        if (override.subject) row.subject = override.subject
        if (override.room) row.room = override.room
      }
      return row
    }),
  }
}

// Returns the effective timetable for a calendar day, including approved overrides.
exports.teacherSchedule = async (req, res) => {
  try {
    if (!isTeacher(req.user) && !isManager(req.user)) return bad(res, 'Teachers or authorised administrators only', 403)
    const dateKey = key(req.query.date || new Date())
    if (!dateKey) return bad(res, 'Invalid date')
    const schedule = await loadTeacherSchedule(req, dateKey)
    if (!schedule) return bad(res, 'Invalid or unavailable teacher', 403)
    if (schedule.invalidSession) return bad(res, 'Invalid session')
    res.json({ date: dateKey, ...schedule })
  } catch (e) { res.status(500).json({ message: e.message }) }
}

exports.teacherOverview = async (req, res) => {
  try {
    if (!isTeacher(req.user) && !isManager(req.user)) return bad(res, 'Teachers or authorised administrators only', 403)
    const dateKey = key(req.query.date || new Date())
    if (!dateKey) return bad(res, 'Invalid date')
    const schedule = await loadTeacherSchedule(req, dateKey)
    if (!schedule) return bad(res, 'Invalid or unavailable teacher', 403)
    if (schedule.invalidSession) return bad(res, 'Invalid session')
    const teachers = await teacherIds(req, req.query.teacher)
    if (!teachers) return bad(res, 'Invalid or unavailable teacher', 403)
    const attendance = await AttendanceRecord.find({
      person: { $in: teachers }, personType: 'teacher', dateKey,
    }).sort('period').populate('person', 'name email role')
    res.json({
      date: dateKey,
      schedule: schedule.data,
      attendance: attendance,
      counts: Object.fromEntries(ATTENDANCE_STATUSES.map(status => [status, attendance.filter(row => row.status === status).length])),
    })
  } catch (e) { res.status(500).json({ message: e.message }) }
}

const teacherPeriodReport = (period) => async (req, res) => {
  try {
    if (!isTeacher(req.user) && !isManager(req.user)) return bad(res, 'Teachers or authorised administrators only', 403)
    let from; let to
    if (period === 'daily') from = to = req.query.date || new Date()
    if (period === 'weekly') {
      from = req.query.from
      to = req.query.to
      if (!from || !to) {
        const date = new Date(req.query.date || new Date())
        if (Number.isNaN(date.getTime())) return bad(res, 'Invalid date')
        const day = date.getUTCDay()
        date.setUTCDate(date.getUTCDate() - day)
        from = date
        const end = new Date(date)
        end.setUTCDate(end.getUTCDate() + 6)
        to = end
      }
    }
    if (period === 'monthly') {
      const month = Number(req.query.month) || new Date().getUTCMonth() + 1
      const year = Number(req.query.year) || new Date().getUTCFullYear()
      if (month < 1 || month > 12 || year < 2000 || year > 2200) return bad(res, 'Invalid month or year')
      from = new Date(Date.UTC(year, month - 1, 1))
      to = new Date(Date.UTC(year, month, 0))
    }
    const result = await teacherReport(req, from, to, req.query.teacher)
    if (result.error) return bad(res, result.error, result.forbidden ? 403 : 400)
    res.json({ period, ...result })
  } catch (e) { res.status(500).json({ message: e.message }) }
}

exports.teacherAttendanceDaily = teacherPeriodReport('daily')
exports.teacherAttendanceWeekly = teacherPeriodReport('weekly')
exports.teacherAttendanceMonthly = teacherPeriodReport('monthly')

exports.listTimetable = async (req, res) => {
  const filter = {}
  ;['academicClass','section','session','teacher','dayOfWeek','status'].forEach(k => { if (req.query[k] !== undefined) filter[k] = req.query[k] })
  if (req.query.date) {
    const routineDate = new Date(`${req.query.date}T00:00:00.000Z`)
    if (Number.isNaN(routineDate.getTime())) return bad(res, 'Invalid timetable date')
    const nextDate = new Date(routineDate)
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)
    filter.date = { $gte: routineDate, $lt: nextDate }
  }
  if (!isManager(req.user) && req.query.status === undefined) filter.status = 'active'
  const scopedFilter = await scopedTimetableFilter(req, filter)
  const data = await TimetableEntry.find(scopedFilter).sort('dayOfWeek period')
    .populate('academicClass','name').populate('teacher','name email')
  res.json({ data })
}
exports.upsertTimetable = async (req, res) => {
  try {
    const b = req.body || {}
    if (!id(b.academicClass) || !b.teacher || !b.section || !b.subject) return bad(res, 'Class, section, teacher and subject are required')
    if (!isManager(req.user)) return bad(res, 'Only authorised administrators can change the timetable', 403)
    if (b._id !== undefined && !id(b._id)) return bad(res, 'Invalid timetable entry ID')
    const dayOfWeek = Number(b.dayOfWeek)
    const period = Number(b.period)
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(period) || period < 1 || period > 20)
      return bad(res, 'Day of week must be 0-6 and period must be 1-20')
    if (!b.date) return bad(res, 'Routine date is required')
    const routineDate = new Date(`${String(b.date).slice(0, 10)}T00:00:00.000Z`)
    if (Number.isNaN(routineDate.getTime())) return bad(res, 'Invalid routine date')
    const startsAt = timeValue(b.startsAt)
    const endsAt = timeValue(b.endsAt)
    if (startsAt === false || endsAt === false || (startsAt && !endsAt) || (!startsAt && endsAt))
      return bad(res, 'Start and end times must use 24-hour HH:MM format')
    if (startsAt && endsAt && startsAt >= endsAt) return bad(res, 'End time must be after start time')
    const academicClass = await AcademicClass.findOne({ _id: b.academicClass, isActive: true }).select('sections')
    if (!academicClass) return bad(res, 'Active academic class is required')
    if (academicClass.sections?.length && !academicClass.sections.includes(String(b.section).trim()))
      return bad(res, 'Section does not belong to the academic class')
    if (!id(b.session)) return bad(res, 'Academic session is required')
    const session = await AcademicSession.findById(b.session).select('_id startsOn endsOn')
    if (!session) return bad(res, 'Academic session is required')
    const teacher = await User.findOne({ _id:b.teacher, role:'teacher', isActive:true }).select('_id')
    if (!teacher) return bad(res, 'An active teacher user is required')
    const section = String(b.section).trim()
    const filter = id(b._id) ? { _id:b._id } : { session:session._id, academicClass:b.academicClass, section, date:routineDate, period }
    const conflictFilter = { session:session._id, dayOfWeek, period, status:'active' }
    if (id(b._id)) conflictFilter._id = { $ne:b._id }
    const teacherConflict = await TimetableEntry.exists({ ...conflictFilter, teacher:b.teacher })
    if (teacherConflict) return bad(res, 'Teacher already has a timetable entry at this day and period', 409)
    if (b.room?.trim()) {
      const roomConflict = await TimetableEntry.exists({ ...conflictFilter, room:b.room.trim() })
      if (roomConflict) return bad(res, 'Room already has a timetable entry at this day and period', 409)
    }
    const update = {
      academicClass:b.academicClass, section, session:session._id, date:routineDate,
      dayOfWeek:routineDate.getUTCDay(),
      period, subject:String(b.subject).trim(), teacher:b.teacher, startsAt, endsAt,
      room:b.room, status:b.status || 'active', createdBy:req.user._id,
    }
    const row = await TimetableEntry.findOneAndUpdate(filter, update, { upsert:true, new:true, runValidators:true })
    await audit(req, b._id ? 'edit' : 'create', 'timetable', row._id, { class: b.academicClass, period: b.period })
    res.status(b._id ? 200 : 201).json({ data: row })
  } catch (e) { res.status(e.code === 11000 ? 409 : 400).json({ message:e.message }) }
}
exports.deleteTimetable = async (req, res) => {
  if (!isManager(req.user)) return bad(res, 'Only administrators can remove timetable entries', 403)
  const row = await TimetableEntry.findByIdAndUpdate(req.params.id, { status:'cancelled' }, { new:true })
  if (!row) return bad(res, 'Timetable entry not found', 404)
  await audit(req, 'delete', 'timetable', row._id, {})
  res.json({ data: row })
}
exports.overrideTimetable = async (req, res) => {
  try {
    const b = req.body || {}
    if (!isManager(req.user) || !id(req.params.id) || !b.reason) return bad(res, 'Entry and reason are required')
    const date = new Date(b.date)
    if (!b.date || Number.isNaN(date.getTime())) return bad(res, 'A valid override date is required')
    date.setUTCHours(0, 0, 0, 0)
    const entry = await TimetableEntry.findById(req.params.id)
    if (!entry) return bad(res, 'Timetable entry not found', 404)
    if (b.substituteTeacher !== undefined) {
      if (!id(b.substituteTeacher)) return bad(res, 'Invalid substitute teacher')
      const substitute = await User.findOne({ _id:b.substituteTeacher, role:'teacher', isActive:true }).select('_id')
      if (!substitute) return bad(res, 'Substitute must be an active teacher')
    }
    const allowed = ['substituteTeacher', 'subject', 'room', 'status', 'reason']
    const payload = {}
    allowed.forEach(field => { if (b[field] !== undefined) payload[field] = b[field] })
    payload.entry = entry._id
    payload.date = date
    payload.createdBy = req.user._id
    const row = await TimetableOverride.findOneAndUpdate({ entry:entry._id, date }, payload, { upsert:true, new:true, runValidators:true })
    await audit(req, 'create', 'timetable-override', row._id, { entry:req.params.id, date:b.date })
    res.status(201).json({ data: row })
  } catch (e) { res.status(400).json({ message:e.message }) }
}

exports.listLeaves = async (req, res) => {
  const filter = {}
  if (!isManager(req.user)) {
    if (req.user.role === 'parent') {
      const links = await ParentStudent.find({ parent: req.user._id, isActive: true }).select('student')
      filter.applicant = { $in: links.map(link => link.student) }
    } else filter.applicant = req.user._id
  } else if (req.query.applicant && id(req.query.applicant)) filter.applicant = req.query.applicant
  if (req.query.status) filter.status = req.query.status
  res.json({ data: await LeaveRequest.find(filter).sort('-createdAt').populate('applicant','name email role').populate('reviewedBy','name') })
}

  exports.lowAttendance = async (req, res) => {
    try {
      if (!isManager(req.user)) return bad(res, 'Only authorised administrators can view low-attendance alerts', 403)
      const options = { from:req.query.from, to:req.query.to, threshold:req.query.threshold, minDays:req.query.minDays }
      const result = req.query.notify === 'true'
        ? await lowAttendanceService.notifyLowAttendance(options)
        : { alerts: await lowAttendanceService.findLowAttendance(options), notificationsCreated: 0 }
      res.json(result)
    } catch (e) { res.status(400).json({ message:e.message }) }
  }
  exports.correctAttendance = async (req, res) => {
    try {
      const row = await AttendanceRecord.findById(req.params.id)
      if (!row) return bad(res, 'Attendance record not found', 404)
      if (!isManager(req.user) && !await canSeePerson(req, row.person)) return bad(res, 'Attendance is outside your scope', 403)
      const b = req.body || {}
      if (!b.correctionReason || !['present','absent','late','leave'].includes(b.status)) return bad(res, 'Correction reason and valid status are required')
      const oldStatus = row.status
      row.status = b.status
      row.lateMinutes = Number(b.lateMinutes) || 0
      row.remarks = b.remarks === undefined ? row.remarks : String(b.remarks).slice(0, 500)
      row.correctionReason = String(b.correctionReason).slice(0, 500)
      row.correctionOf = row._id
      row.recordedBy = req.user._id
      row.source = 'manual'
      await row.save()
      await audit(req, 'correct', 'attendance', row._id, { oldStatus, newStatus:row.status, correctionReason:row.correctionReason })
      res.json({ data:row })
    } catch (e) { res.status(400).json({ message:e.message }) }
  }
exports.createLeave = async (req, res) => {
  try {
    const b=req.body||{}; const from=new Date(b.fromDate); const to=new Date(b.toDate)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to || !b.reason) return bad(res,'Valid leave dates and reason are required')
    let applicant = req.user._id
    if (req.user.role === 'parent') {
      if (!id(b.student)) return bad(res, 'A valid linked child is required')
      const linked = await ParentStudent.exists({ parent:req.user._id, student:b.student, isActive:true })
      if (!linked) return bad(res, 'Child is not linked to this parent', 403)
      const child = await User.findOne({ _id:b.student, role:'student', isActive:true }).select('_id')
      if (!child) return bad(res, 'Active student account not found')
      applicant = child._id
    } else if (!['student','teacher','staff'].includes(req.user.role)) {
      return bad(res, 'Only students, teachers, staff, or parents may submit leave', 403)
    }
    const personType = req.user.role === 'parent' ? 'student' : req.user.role
    const row=await LeaveRequest.create({ applicant, personType, fromDate:from, toDate:to, reason:String(b.reason).trim() })
    await audit(req,'create','leave',row._id,{ fromDate:b.fromDate,toDate:b.toDate }); res.status(201).json({data:row})
  } catch(e) { res.status(400).json({message:e.message}) }
}
exports.reviewLeave = async (req,res) => {
  if (!isManager(req.user)) return bad(res,'Only administrators can review leave',403)
  if (!['approved','rejected','cancelled'].includes(req.body.status)) return bad(res,'Invalid leave status')
  const row=await LeaveRequest.findByIdAndUpdate(req.params.id,{status:req.body.status,reviewedBy:req.user._id,reviewedAt:new Date()},{new:true,runValidators:true})
  if(!row)return bad(res,'Leave request not found',404)
  if (row.status === 'approved') {
    const target = await User.findById(row.applicant).select('role isActive')
    if (target?.isActive) {
      for (let date = new Date(row.fromDate); date <= row.toDate; date.setUTCDate(date.getUTCDate() + 1)) {
        const dateKey = key(date)
        await AttendanceRecord.findOneAndUpdate(
          { person: row.applicant, dateKey, mode: 'daily', period: undefined },
          { person: row.applicant, personType: row.personType, date: new Date(`${dateKey}T00:00:00.000Z`), dateKey, mode: 'daily', status: 'leave', source: 'leave', recordedBy: req.user._id, remarks: `Leave request ${row._id}` },
          { upsert: true, runValidators: true }
        )
      }
    }
  }
  await audit(req,'edit','leave',row._id,{status:row.status})
  res.json({data:row})
}

exports.me = async (req,res) => {
  let people = [req.user._id]
  if (req.user.role === 'parent') {
    const links = await ParentStudent.find({ parent:req.user._id, isActive:true }).select('student')
    people = links.map(link => link.student)
  }
  const rows=await AttendanceRecord.find({person: { $in: people }}).sort('-date').limit(365)
    .populate('person','name email role')
  res.json({data:rows})
}
