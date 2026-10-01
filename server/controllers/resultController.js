const { Result } = require('../models/index')

/* ── GPA / Grade calculation (Nepal grading system) ── */
function calcGrade(pct) {
  if (pct >= 90) return { grade:'A+', gpa:4.0, label:'Outstanding' }
  if (pct >= 80) return { grade:'A',  gpa:3.6, label:'Excellent'   }
  if (pct >= 70) return { grade:'B+', gpa:3.2, label:'Very Good'   }
  if (pct >= 60) return { grade:'B',  gpa:2.8, label:'Good'        }
  if (pct >= 50) return { grade:'C+', gpa:2.4, label:'Satisfactory'}
  if (pct >= 40) return { grade:'C',  gpa:2.0, label:'Acceptable'  }
  if (pct >= 35) return { grade:'D+', gpa:1.6, label:'Partially Acceptable' }
  if (pct >= 28) return { grade:'D',  gpa:1.2, label:'Insufficient'}
  return              { grade:'NG', gpa:0.0, label:'Not Graded'   }
}

function computeResult(subjects) {
  const validSubs = (subjects || []).filter(s => s.name && s.name.trim())
  const totalFM   = validSubs.reduce((a,s) => a + (Number(s.fm)||0), 0)
  const obtained  = validSubs.reduce((a,s) => a + (Number(s.total)||0), 0)
  const pct       = totalFM > 0 ? Math.round((obtained/totalFM)*10000)/100 : 0
  const gradeInfo = calcGrade(pct)
  // Check if any subject failed (below pass marks)
  const anyFailed = validSubs.some(s => (Number(s.total)||0) < (Number(s.pm)||40))
  const result    = anyFailed ? 'Fail' : pct >= 28 ? 'Pass' : 'Fail'
  let division = ''
  if (result === 'Pass') {
    if (pct >= 75) division = 'Distinction'
    else if (pct >= 60) division = 'First Division'
    else if (pct >= 45) division = 'Second Division'
    else division = 'Third Division'
  } else { division = 'Fail' }
  return { totalMarks:totalFM, obtainedMarks:obtained, percentage:pct, ...gradeInfo, division, passed:result==='Pass' }
}

function enrichSubjects(subjects) {
  return (subjects||[]).filter(s=>s.name&&s.name.trim()).map(s => {
    const th    = s.th != null ? Number(s.th) : 0
    const pr    = s.pr != null ? Number(s.pr) : 0
    const fm    = s.fm != null ? Number(s.fm) : 100
    const pm    = s.pm != null ? Number(s.pm) : 40
    const total = s.total != null ? Number(s.total) : (s.subjectTotal != null ? Number(s.subjectTotal) : th + pr)
    const subPct = fm > 0 ? Math.round((total/fm)*10000)/100 : 0
    const { grade, gpa } = calcGrade(subPct)
    return {
      ...s,
      fm, pm, th, pr, total,
      grade: s.grade || s.finalGrade || grade,
      gpa: s.gpa != null ? s.gpa : (s.gradePoint != null ? s.gradePoint : gpa),
      passed: total >= pm
    }
  })
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/[^0-9]/g, '')
  if (digits.startsWith('977') && digits.length > 10) digits = digits.slice(3)
  if (digits.startsWith('0') && digits.length > 9) digits = digits.slice(1)
  return digits
}

function phoneVariants(value) {
  const digits = normalizePhone(value)
  return [...new Set([
    digits,
    digits.slice(-10),
    digits.slice(-9),
    digits.slice(-8),
  ].filter(v => v.length >= 7))]
}

function normalizeIdentifier(value) {
  return String(value || '').trim().replace(/\s+/g, '').toLowerCase()
}

function examTypeMatches(stored, requested) {
  const aliases = {
    '1stterminal': ['1stterminal', '1stterm'],
    '1stterm': ['1stterminal', '1stterm'],
    '2ndterminal': ['2ndterminal', '2ndterm'],
    '2ndterm': ['2ndterminal', '2ndterm'],
    'finalterm': ['finalterm', 'annual'],
    'annual': ['finalterm', 'annual'],
  }
  const wanted = normalizeIdentifier(requested)
  const actual = normalizeIdentifier(stored)
  return (aliases[wanted] || [wanted]).includes(actual)
}

exports.parentLookup = async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ message: 'Parents only' })
  if (!req.user.phone) return res.status(400).json({ message: 'A phone number is required on the parent profile' })
  req.query = { phone: req.user.phone }
  return exports.lookupResult(req, res)
}

/* ── public: lookup ── */
exports.lookupResult = async (req, res) => {
  try {
    const { phone, symbolNo, rollNo, examType, academicYear } = req.query

    if (!phone && !symbolNo && !rollNo) {
      return res.status(400).json({ message: 'Provide phone number, symbol number, or roll number' })
    }

    // Clean inputs
    let cleanPhone = ''
    if (phone) {
      cleanPhone = normalizePhone(phone)
    }
    const cleanSymbol = symbolNo ? String(symbolNo).trim() : ''
    const cleanRoll   = rollNo   ? String(rollNo).trim()   : ''
    const queryPhoneVariants = cleanPhone ? phoneVariants(cleanPhone) : []

    const all = await Result.find({}).lean()

    // Step 2: match by identifier (phone OR symbol OR roll)
    const matched = all.filter(r => {
      if (cleanPhone) {
        const storedPhone = normalizePhone(r.parentPhone)
        const storedVariants = phoneVariants(storedPhone)
        const match = storedVariants.some(stored => queryPhoneVariants.some(query => stored === query || stored.endsWith(query) || query.endsWith(stored)))
        return match
      }
      if (cleanSymbol) {
        const match = normalizeIdentifier(r.symbolNo) === normalizeIdentifier(cleanSymbol)
        return match
      }
      if (cleanRoll) {
        const match = normalizeIdentifier(r.rollNo) === normalizeIdentifier(cleanRoll)
        return match
      }
      return false
    })

    if (!matched.length) {
      return res.status(404).json({
        message: 'No results found. Please check your phone number, symbol number, or roll number and try again.'
      })
    }

    // Step 3: check publish status
    const published   = matched.filter(r => r.isPublished === true)

    if (published.length === 0) {
      return res.status(404).json({
        message: 'Your result has been submitted but is not yet published. Please contact the school office.'
      })
    }

    // Step 4: apply optional exam/year filters ONLY if they are provided and not empty
    let final = published
    const et = examType ? String(examType).trim() : ''
    const ay = academicYear ? String(academicYear).trim() : ''

    if (et) {
      final = final.filter(r => examTypeMatches(r.examType, et))
    }
    if (ay) {
      final = final.filter(r => String(r.academicYear || '').trim() === ay)
    }

    // Step 5: if filters removed everything, return the unfiltered published results instead
    if (!final.length) return res.status(404).json({ message: 'No published result matched the requested filters' })

    final.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const data = final.map(result => ({
      _id: result._id,
      studentName: result.studentName,
      examType: result.examType,
      academicYear: result.academicYear,
      class: result.class,
      section: result.section,
      rollNo: result.rollNo,
      symbolNo: result.symbolNo,
      dateOfIssue: result.dateOfIssue,
      subjects: result.subjects,
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      grade: result.grade,
      gpa: result.gpa,
      division: result.division,
      passed: result.passed,
    }))
    return res.json({ data, total: data.length })

  } catch (err) {
    console.error('Result lookup failed')
    return res.status(500).json({ message: 'Unable to retrieve results' })
  }
}

/* ── admin: get all ── */
exports.getAllResults = async (req, res) => {
  try {
    const { class:cls, examType, academicYear, search } = req.query
    const q = {}
    if (cls)          q.class       = cls
    if (examType)     q.examType    = examType
    if (academicYear) q.academicYear = academicYear
    if (search)       q.$or = [
      { studentName:  { $regex:search, $options:'i' } },
      { parentPhone:  { $regex:search } },
      { symbolNo:     { $regex:search, $options:'i' } },
      { rollNo:       { $regex:search, $options:'i' } },
    ]
    const results = await Result.find(q).sort({ class:1, rank:1, studentName:1 })
    res.json({ data:results, total:results.length })
  } catch(err) { res.status(500).json({ message:err.message }) }
}

/* ── admin: create ── */
exports.createResult = async (req, res) => {
  try {
    const data = { ...req.body }
    if (!data.studentName?.trim()) return res.status(400).json({ message:'Student name is required' })
    if (!data.parentPhone?.trim()) return res.status(400).json({ message:'Parent phone is required' })
    if (!data.class)               return res.status(400).json({ message:'Class is required' })
    if (!data.examType)            return res.status(400).json({ message:'Exam type is required' })

    data.parentPhone = String(data.parentPhone).replace(/\D/g,'').replace(/^977/,'')

    /*
     * Smart duplicate check:
     * Two records are the same student-exam if ANY of these match
     * for the same class + examType + academicYear:
     *   (a) same parentPhone
     *   (b) same symbolNo  (when both are non-empty)
     *   (c) same rollNo    (when both are non-empty)
     * Students with the same name but ALL different identifiers are allowed.
     */
    const baseQuery = { class: data.class, examType: data.examType, academicYear: data.academicYear }
    const orClauses = [
      { parentPhone: data.parentPhone },
    ]
    if (data.symbolNo && data.symbolNo.trim()) {
      orClauses.push({ symbolNo: data.symbolNo.trim() })
    }
    if (data.rollNo && data.rollNo.trim()) {
      orClauses.push({ rollNo: data.rollNo.trim() })
    }
    const existing = await Result.findOne({ ...baseQuery, $or: orClauses })
    if (existing) {
      const matchedBy = existing.parentPhone === data.parentPhone ? 'phone number'
        : existing.symbolNo === data.symbolNo  ? 'symbol number'
        : 'roll number'
      return res.status(409).json({
        message: `A result already exists for this ${matchedBy} (${data.class} — ${data.examType} ${data.academicYear}). Use Edit to update it.`,
        existingId: existing._id,
      })
    }

    data.subjects  = enrichSubjects(data.subjects)
    const computed = computeResult(data.subjects)
    Object.assign(data, computed)
    const doc = await Result.create(data)
    res.status(201).json({ message:'Result created successfully', data:doc })
  } catch(err) { res.status(400).json({ message:err.message }) }
}

/* ── admin: update ── */
exports.updateResult = async (req, res) => {
  try {
    const data = { ...req.body }
    if (data.parentPhone) data.parentPhone = String(data.parentPhone).replace(/\D/g,'').replace(/^977/,'')
    if (data.subjects)    data.subjects    = enrichSubjects(data.subjects)
    const computed = computeResult(data.subjects)
    Object.assign(data, computed)
    const doc = await Result.findByIdAndUpdate(req.params.id, data, { new:true })
    if (!doc) return res.status(404).json({ message:'Result not found' })
    res.json({ message:'Result updated', data:doc })
  } catch(err) { res.status(400).json({ message:err.message }) }
}

/* ── admin: delete ── */
exports.deleteResult = async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id)
    res.json({ message:'Result deleted' })
  } catch(err) { res.status(500).json({ message:err.message }) }
}

/* ── admin: bulk import ── */
exports.bulkImport = async (req, res) => {
  try {
    const { results } = req.body
    if (!Array.isArray(results) || !results.length)
      return res.status(400).json({ message:'Provide an array of results' })

    let inserted = 0
    let skipped  = 0
    const errors = []

    for (const r of results) {
      try {
        if (!r.studentName?.trim() || !r.parentPhone?.trim()) {
          errors.push(`Skipped row: missing studentName or parentPhone`)
          skipped++; continue
        }

        if (r.parentPhone) r.parentPhone = String(r.parentPhone).replace(/\D/g,'').replace(/^977/,'')

        // Smart duplicate check (same as createResult)
        const baseQuery = { class: r.class, examType: r.examType, academicYear: r.academicYear }
        const orClauses = [{ parentPhone: r.parentPhone }]
        if (r.symbolNo && r.symbolNo.trim()) orClauses.push({ symbolNo: r.symbolNo.trim() })
        if (r.rollNo   && r.rollNo.trim())   orClauses.push({ rollNo:   r.rollNo.trim()   })

        const dup = await Result.findOne({ ...baseQuery, $or: orClauses })
        if (dup) {
          errors.push(`Skipped "${r.studentName}" (${r.class} ${r.examType} ${r.academicYear}) — duplicate record found.`)
          skipped++; continue
        }

        r.subjects = enrichSubjects(r.subjects || [])
        Object.assign(r, computeResult(r.subjects))
        await Result.create(r)
        inserted++
      } catch(e) {
        errors.push(`"${r.studentName || '?'}": ${e.message}`)
        skipped++
      }
    }

    res.json({
      message: `Imported ${inserted} of ${results.length} student${results.length>1?'s':''}${skipped>0?` (${skipped} skipped)`:''}`,
      inserted, skipped, errors,
    })
  } catch(err) { res.status(500).json({ message:err.message }) }
}

/* ── admin: toggle publish ── */
exports.togglePublish = async (req, res) => {
  try {
    const { ids, isPublished } = req.body
    await Result.updateMany({ _id:{ $in:ids } }, { isPublished })
    res.json({ message:`Results ${isPublished?'published':'unpublished'}` })
  } catch(err) { res.status(500).json({ message:err.message }) }
}

/* ── admin: export ── */
exports.exportResults = async (req, res) => {
  try {
    const q = {}
    if (req.query.class)        q.class        = req.query.class
    if (req.query.examType)     q.examType     = req.query.examType
    if (req.query.academicYear) q.academicYear = req.query.academicYear
    const results = await Result.find(q).sort({ class:1, rank:1 })
    res.json({ data:results })
  } catch(err) { res.status(500).json({ message:err.message }) }
}

/* ── admin: meta ── */
exports.getMeta = async (req, res) => {
  try {
    const [classes, examTypes, years] = await Promise.all([
      Result.distinct('class'),
      Result.distinct('examType'),
      Result.distinct('academicYear'),
    ])
    res.json({ classes, examTypes, years })
  } catch(err) { res.status(500).json({ message:err.message }) }
}
