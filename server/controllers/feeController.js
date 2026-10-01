const {
  FeeGroup, FeeType, FeeMaster, FeePayment, FeePaymentItem, Discount, Admission,
} = require('../models/index')

const ok  = (res, data, code=200) => res.status(code).json(data)
const err = (res, msg, code=500)  => res.status(code).json({ message: msg })

/* ── helpers ─────────────────────────────────────────────────────────────── */
const pageOpts = (q) => {
  const page  = Math.max(1, parseInt(q.page)  || 1)
  const limit = Math.min(100, parseInt(q.limit) || 20)
  return { page, limit, skip: (page-1)*limit }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEE GROUPS
═══════════════════════════════════════════════════════════════════════════ */
exports.listFeeGroups = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' }
    if (req.query.status) filter.status = req.query.status
    const [data, total] = await Promise.all([
      FeeGroup.find(filter).sort('-createdAt').skip(skip).limit(limit),
      FeeGroup.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createFeeGroup = async (req, res) => {
  try {
    const exists = await FeeGroup.findOne({ name: { $regex: `^${req.body.name}$`, $options: 'i' } })
    if (exists) return err(res, 'Fee Group with this name already exists', 400)
    const doc = await FeeGroup.create({ ...req.body, createdBy: req.user._id })
    ok(res, { message: 'Fee Group created', data: doc }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updateFeeGroup = async (req, res) => {
  try {
    const doc = await FeeGroup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deleteFeeGroup = async (req, res) => {
  try {
    const used = await FeeType.countDocuments({ feeGroup: req.params.id })
    if (used > 0) return err(res, `Cannot delete — ${used} Fee Type(s) belong to this group`, 400)
    const doc = await FeeGroup.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEE TYPES
═══════════════════════════════════════════════════════════════════════════ */
exports.listFeeTypes = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.search)   filter.name     = { $regex: req.query.search, $options: 'i' }
    if (req.query.status)   filter.status   = req.query.status
    if (req.query.feeGroup) filter.feeGroup = req.query.feeGroup
    const [data, total] = await Promise.all([
      FeeType.find(filter).populate('feeGroup','name').sort('feeGroup name').skip(skip).limit(limit),
      FeeType.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createFeeType = async (req, res) => {
  try {
    const doc = await FeeType.create({ ...req.body, createdBy: req.user._id })
    const populated = await doc.populate('feeGroup','name')
    ok(res, { message: 'Fee Type created', data: populated }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updateFeeType = async (req, res) => {
  try {
    const doc = await FeeType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('feeGroup','name')
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deleteFeeType = async (req, res) => {
  try {
    const used = await FeeMaster.countDocuments({ feeType: req.params.id })
    if (used > 0) return err(res, `Cannot delete — used in ${used} Fee Master record(s)`, 400)
    const doc = await FeeType.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEE MASTER
═══════════════════════════════════════════════════════════════════════════ */
exports.listFeeMasters = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.academicYear) filter.academicYear = req.query.academicYear
    if (req.query.class)        filter.class        = req.query.class
    if (req.query.status)       filter.status       = req.query.status
    const [data, total] = await Promise.all([
      FeeMaster.find(filter)
        .populate({ path:'feeType', populate:{ path:'feeGroup', select:'name' } })
        .sort('class academicYear')
        .skip(skip).limit(limit),
      FeeMaster.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createFeeMaster = async (req, res) => {
  try {
    const doc = await FeeMaster.create({ ...req.body, createdBy: req.user._id })
    const populated = await doc.populate({ path:'feeType', populate:{ path:'feeGroup', select:'name' } })
    ok(res, { message: 'Fee Master created', data: populated }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updateFeeMaster = async (req, res) => {
  try {
    const doc = await FeeMaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({ path:'feeType', populate:{ path:'feeGroup', select:'name' } })
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deleteFeeMaster = async (req, res) => {
  try {
    const doc = await FeeMaster.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   STUDENT FEE ACCOUNT  (for Collect Fees page)
═══════════════════════════════════════════════════════════════════════════ */
exports.getStudentFeeAccount = async (req, res) => {
  try {
    const student = await Admission.findById(req.params.admissionId)
    if (!student) return err(res, 'Student not found', 404)

    const academicYear = req.query.academicYear || new Date().getFullYear().toString()

    // Fee masters for this class/year
    const masters = await FeeMaster.find({
      class: student.classApplying,
      academicYear,
      status: 'active',
    }).populate({ path:'feeType', populate:{ path:'feeGroup', select:'name' } })

    // All discounts for this student (active)
    const discounts = await Discount.find({ student: student._id, status: 'active' })
      .populate('feeType', 'name')

    // All paid items for this student/year
    const payments = await FeePayment.find({
      student: student._id,
      academicYear,
      status: 'paid',
    })
    const paymentIds = payments.map(p => p._id)
    const items = await FeePaymentItem.find({ payment: { $in: paymentIds } })
      .populate('feeType', 'name')

    // Build fee account lines
    const account = masters.map(m => {
      const feeTypeId = m.feeType._id.toString()

      // Get applicable discount for this fee type
      const disc = discounts.find(d => !d.feeType || d.feeType._id.toString() === feeTypeId)
      const totalAmt = m.amount
      let discAmt = 0
      if (disc) {
        discAmt = disc.isPercent
          ? Math.round(totalAmt * disc.value / 100)
          : Math.min(disc.value, totalAmt)
      }

      // Paid for this fee type
      const paidAmt = items
        .filter(i => i.feeType._id.toString() === feeTypeId)
        .reduce((s, i) => s + i.net, 0)

      const netDue = Math.max(0, totalAmt - discAmt - paidAmt)

      return {
        feeTypeId,
        feeTypeName: m.feeType.name,
        feeGroupName: m.feeType.feeGroup?.name || '',
        totalAmt,
        discAmt,
        paidAmt,
        netDue,
        masterId: m._id,
      }
    })

    const summary = {
      totalFees:    account.reduce((s, a) => s + a.totalAmt, 0),
      totalDiscount:account.reduce((s, a) => s + a.discAmt, 0),
      totalPaid:    account.reduce((s, a) => s + a.paidAmt, 0),
      totalDue:     account.reduce((s, a) => s + a.netDue, 0),
    }

    ok(res, { student, account, summary, payments })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLLECT FEES (create payment)
═══════════════════════════════════════════════════════════════════════════ */
exports.collectFee = async (req, res) => {
  try {
    const { studentId, academicYear, paymentDate, paymentMethod, remarks, items } = req.body
    // items: [{ feeTypeId, amount, discount, net }]
    if (!items || !items.length) return err(res, 'No fee items provided', 400)

    const totalAmount = items.reduce((s, i) => s + Number(i.amount), 0)
    const totalDisc   = items.reduce((s, i) => s + Number(i.discount||0), 0)
    const netAmount   = items.reduce((s, i) => s + Number(i.net), 0)

    const payment = await FeePayment.create({
      student:       studentId,
      academicYear,
      paymentDate:   paymentDate || new Date(),
      paymentMethod: paymentMethod || 'cash',
      totalAmount,
      discount:      totalDisc,
      netAmount,
      remarks,
      collectedBy:   req.user._id,
      status:        'paid',
    })

    const paymentItems = await FeePaymentItem.insertMany(
      items.map(i => ({
        payment:  payment._id,
        feeType:  i.feeTypeId,
        amount:   Number(i.amount),
        discount: Number(i.discount||0),
        net:      Number(i.net),
      }))
    )

    const populated = await FeePayment.findById(payment._id)
      .populate('student','studentName classApplying parentName phone')
      .populate('collectedBy','name')

    ok(res, { message: 'Payment collected', data: populated, items: paymentItems }, 201)
  } catch(e) { err(res, e.message) }
}

exports.listPayments = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.receiptNo)     filter.receiptNo     = { $regex: req.query.receiptNo, $options:'i' }
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod
    if (req.query.academicYear)  filter.academicYear  = req.query.academicYear
    if (req.query.status)        filter.status        = req.query.status
    if (req.query.dateFrom || req.query.dateTo) {
      filter.paymentDate = {}
      if (req.query.dateFrom) filter.paymentDate.$gte = new Date(req.query.dateFrom)
      if (req.query.dateTo)   filter.paymentDate.$lte = new Date(req.query.dateTo + 'T23:59:59')
    }

    let query = FeePayment.find(filter)
      .populate('student','studentName classApplying')
      .populate('collectedBy','name')
      .sort('-paymentDate')

    // student name/class search
    if (req.query.search) {
      const students = await Admission.find({
        studentName: { $regex: req.query.search, $options:'i' },
      }).select('_id')
      filter.student = { $in: students.map(s=>s._id) }
      query = FeePayment.find(filter)
        .populate('student','studentName classApplying')
        .populate('collectedBy','name')
        .sort('-paymentDate')
    }

    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit),
      FeePayment.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.getPayment = async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id)
      .populate('student','studentName classApplying section parentName phone email')
      .populate('collectedBy','name')
    if (!payment) return err(res, 'Not found', 404)
    const items = await FeePaymentItem.find({ payment: payment._id })
      .populate({ path:'feeType', populate:{ path:'feeGroup', select:'name' } })
    ok(res, { data: payment, items })
  } catch(e) { err(res, e.message) }
}

exports.cancelPayment = async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id)
    if (!payment) return err(res, 'Not found', 404)
    if (payment.status === 'cancelled') return err(res, 'Already cancelled', 400)
    payment.status = 'cancelled'
    await payment.save()
    ok(res, { message: 'Payment cancelled' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEES STATEMENT (student-wise)
═══════════════════════════════════════════════════════════════════════════ */
exports.getStatement = async (req, res) => {
  try {
    const student = await Admission.findById(req.params.admissionId)
    if (!student) return err(res, 'Student not found', 404)

    const filter = { student: student._id }
    if (req.query.academicYear) filter.academicYear = req.query.academicYear
    if (req.query.status)       filter.status       = req.query.status

    const payments = await FeePayment.find(filter)
      .populate('collectedBy','name')
      .sort('-paymentDate')

    const paymentIds = payments.map(p=>p._id)
    const items = await FeePaymentItem.find({ payment: { $in: paymentIds } })
      .populate({ path:'feeType', populate:{ path:'feeGroup', select:'name' } })

    const paymentsWithItems = payments.map(p => ({
      ...p.toObject(),
      items: items.filter(i => i.payment.toString() === p._id.toString()),
    }))

    const summary = {
      totalPaid:    payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.netAmount,0),
      totalDiscount:payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.discount,0),
    }

    ok(res, { student, payments: paymentsWithItems, summary })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEES DUE (all students with outstanding amounts)
═══════════════════════════════════════════════════════════════════════════ */
exports.getFeesDue = async (req, res) => {
  try {
    const academicYear = req.query.academicYear || new Date().getFullYear().toString()
    const classFilter  = req.query.class

    // Get all fee masters for this year
    const masterFilter = { academicYear, status:'active' }
    if (classFilter) masterFilter.class = classFilter
    const masters = await FeeMaster.find(masterFilter).populate('feeType','name')

    const classNames = [...new Set(masters.map(m=>m.class))]
    const studentFilter = classNames.length ? { classApplying: { $in: classNames }, status:'approved' } : { status:'approved' }
    if (classFilter) studentFilter.classApplying = classFilter

    const students = await Admission.find(studentFilter).sort('classApplying studentName')

    const paymentsList = await FeePayment.find({
      student: { $in: students.map(s=>s._id) },
      academicYear,
      status:'paid',
    })
    const itemsList = await FeePaymentItem.find({ payment: { $in: paymentsList.map(p=>p._id) } })
    const discountsList = await Discount.find({ student: { $in: students.map(s=>s._id) }, status:'active' })

    const result = students.map(student => {
      const classMasters = masters.filter(m => m.class === student.classApplying)
      if (!classMasters.length) return null

      const totalFees = classMasters.reduce((s,m)=>s+m.amount,0)

      const studentDiscounts = discountsList.filter(d=>d.student.toString()===student._id.toString())
      const totalDiscount = studentDiscounts.reduce((s,d) => {
        const base = d.feeType
          ? (classMasters.find(m=>m.feeType._id.toString()===d.feeType.toString())?.amount||0)
          : totalFees
        return s + (d.isPercent ? Math.round(base*d.value/100) : Math.min(d.value,base))
      },0)

      const studentPayIds = paymentsList
        .filter(p=>p.student.toString()===student._id.toString())
        .map(p=>p._id)
      const totalPaid = itemsList
        .filter(i=>studentPayIds.includes(i.payment))
        .reduce((s,i)=>s+i.net,0)

      const outstanding = Math.max(0, totalFees - totalDiscount - totalPaid)
      const lastPay = paymentsList
        .filter(p=>p.student.toString()===student._id.toString())
        .sort((a,b)=>new Date(b.paymentDate)-new Date(a.paymentDate))[0]

      return {
        student: {
          _id: student._id,
          studentName: student.studentName,
          classApplying: student.classApplying,
          phone: student.phone,
          parentName: student.parentName,
        },
        totalFees, totalDiscount, totalPaid, outstanding,
        lastPaymentDate: lastPay?.paymentDate || null,
      }
    }).filter(r=>r && r.outstanding > 0)

    ok(res, { data: result, total: result.length })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DISCOUNTS
═══════════════════════════════════════════════════════════════════════════ */
exports.listDiscounts = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.student) filter.student = req.query.student
    const [data, total] = await Promise.all([
      Discount.find(filter)
        .populate('student','studentName classApplying')
        .populate('feeType','name')
        .populate('approvedBy','name')
        .sort('-createdAt').skip(skip).limit(limit),
      Discount.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createDiscount = async (req, res) => {
  try {
    const doc = await Discount.create({ ...req.body, createdBy: req.user._id })
    const populated = await doc.populate([
      { path:'student', select:'studentName classApplying' },
      { path:'feeType', select:'name' },
    ])
    ok(res, { message: 'Discount created', data: populated }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updateDiscount = async (req, res) => {
  try {
    const doc = await Discount.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
      .populate('student','studentName classApplying')
      .populate('feeType','name')
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deleteDiscount = async (req, res) => {
  try {
    const doc = await Discount.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REPORTS
═══════════════════════════════════════════════════════════════════════════ */
exports.getDailyReport = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date()
    const start = new Date(date); start.setHours(0,0,0,0)
    const end   = new Date(date); end.setHours(23,59,59,999)

    const payments = await FeePayment.find({
      paymentDate: { $gte: start, $lte: end },
      status: 'paid',
    }).populate('student','studentName classApplying').populate('collectedBy','name')

    const summary = {
      totalTransactions: payments.length,
      totalCollection:   payments.reduce((s,p)=>s+p.netAmount,0),
      totalDiscount:     payments.reduce((s,p)=>s+p.discount,0),
      byMethod: payments.reduce((acc,p)=>{
        acc[p.paymentMethod] = (acc[p.paymentMethod]||0) + p.netAmount
        return acc
      },{}),
    }
    ok(res, { summary, payments })
  } catch(e) { err(res, e.message) }
}

exports.getMonthlySummary = async (req, res) => {
  try {
    const year  = parseInt(req.query.year  || new Date().getFullYear())
    const month = parseInt(req.query.month || new Date().getMonth()+1)
    const start = new Date(year, month-1, 1)
    const end   = new Date(year, month,   0, 23, 59, 59)

    const payments = await FeePayment.find({
      paymentDate: { $gte: start, $lte: end },
      status: 'paid',
    })

    const summary = {
      month, year,
      totalTransactions: payments.length,
      totalCollection:   payments.reduce((s,p)=>s+p.netAmount,0),
      totalDiscount:     payments.reduce((s,p)=>s+p.discount,0),
    }
    ok(res, { summary })
  } catch(e) { err(res, e.message) }
}

exports.getReportsSummary = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [todayPay, monthPay, allPay, pendingStudents] = await Promise.all([
      FeePayment.find({ paymentDate:{ $gte:today,$lte:todayEnd }, status:'paid' }),
      FeePayment.find({ paymentDate:{ $gte:monthStart }, status:'paid' }),
      FeePayment.find({ status:'paid' }),
      Admission.countDocuments({ status:'approved' }),
    ])

    ok(res, {
      todayCollection:  todayPay.reduce((s,p)=>s+p.netAmount,0),
      monthCollection:  monthPay.reduce((s,p)=>s+p.netAmount,0),
      totalCollection:  allPay.reduce((s,p)=>s+p.netAmount,0),
      totalTransactions:allPay.length,
      approvedStudents: pendingStudents,
    })
  } catch(e) { err(res, e.message) }
}

/* search students for collect fees autocomplete */
exports.searchStudents = async (req, res) => {
  try {
    const q = req.query.q || ''
    const students = await Admission.find({
      $or: [
        { studentName: { $regex: q, $options:'i' } },
        { phone:       { $regex: q, $options:'i' } },
      ],
      status: 'approved',
    }).select('studentName classApplying section parentName phone').limit(20)
    ok(res, { data: students })
  } catch(e) { err(res, e.message) }
}
