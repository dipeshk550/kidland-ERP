const {
  TransportRoute, RouteStop, Vehicle, Driver, VehicleStaff,
  StudentTransport, TransportAttendance, VehicleMaintenance, FuelRecord, Admission,
} = require('../models/index')
const mongoose = require('mongoose')

const ok  = (res, data, status = 200) => res.status(status).json(data)
const err = (res, e, status = 500)   => res.status(status).json({ message: e?.message || 'Server error' })

// ─── Strip empty strings from ObjectId reference fields ──────────────────────
// Mongoose throws "Cast to ObjectId failed" when value is "" (empty string).
// This helper removes those keys so Mongoose ignores optional refs.
const REF_FIELDS = [
  'vehicle','driver','helper','route','assignedVehicle','assignedRoute',
  'assignedDriver','pickupStop','dropoffStop','student','recordedBy',
  'assignedBy','createdBy','collectedBy',
]
const cleanBody = (body = {}) => {
  const out = { ...body }
  REF_FIELDS.forEach(k => {
    if (Object.prototype.hasOwnProperty.call(out, k)) {
      const v = out[k]
      if (v === '' || v === null || v === 'null' || v === 'undefined' || v === undefined) {
        delete out[k]
      }
    }
  })
  return out
}

// ── helpers ──────────────────────────────────────────────────────────────────
const paginate = (query, page = 1, limit = 20) => {
  const skip = (Number(page) - 1) * Number(limit)
  return query.skip(skip).limit(Number(limit))
}
const daysUntil = (date) => {
  if (!date) return null
  return Math.ceil((new Date(date) - new Date()) / 86400000)
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const [
      totalVehicles, activeVehicles, maintenanceVehicles,
      totalRoutes, activeRoutes,
      totalDrivers, totalStaff,
      totalStudents, activeStudents,
      todayPickup, todayDropoff,
      pendingMaintenance, totalMaintenanceCost, totalFuelCost,
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'maintenance' }),
      TransportRoute.countDocuments(),
      TransportRoute.countDocuments({ status: 'active' }),
      Driver.countDocuments({ status: 'active' }),
      VehicleStaff.countDocuments({ status: 'active' }),
      StudentTransport.countDocuments(),
      StudentTransport.countDocuments({ status: 'active' }),
      TransportAttendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, pickupStatus: 'present' }),
      TransportAttendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, dropoffStatus: 'present' }),
      VehicleMaintenance.countDocuments({ nextServiceDate: { $lte: new Date(Date.now() + 30*86400000) } }),
      VehicleMaintenance.aggregate([{ $group: { _id: null, total: { $sum: '$cost' } } }]),
      FuelRecord.aggregate([{ $group: { _id: null, total: { $sum: '$totalCost' } } }]),
    ])

    const studentsByRoute = await StudentTransport.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$route', count: { $sum: 1 } } },
      { $lookup: { from: 'transportroutes', localField: '_id', foreignField: '_id', as: 'route' } },
      { $unwind: { path: '$route', preserveNullAndEmptyArrays: true } },
      { $project: { routeName: { $ifNull: ['$route.routeName', 'Unknown'] }, count: 1 } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ])

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthlyFuel = await FuelRecord.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' } }, total: { $sum: '$totalCost' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ])
    const monthlyMaintenance = await VehicleMaintenance.aggregate([
      { $match: { serviceDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { y: { $year: '$serviceDate' }, m: { $month: '$serviceDate' } }, total: { $sum: '$cost' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ])

    const thirtyDays = new Date(Date.now() + 30*86400000)
    const expiryWarnings = await Vehicle.find({
      $or: [
        { insuranceExpiry: { $lte: thirtyDays } },
        { taxExpiry: { $lte: thirtyDays } },
        { fitnessExpiry: { $lte: thirtyDays } },
      ]
    }).select('vehicleNumber insuranceExpiry taxExpiry fitnessExpiry status').limit(10)

    ok(res, {
      stats: {
        totalVehicles, activeVehicles, maintenanceVehicles,
        totalRoutes, activeRoutes, totalDrivers, totalStaff,
        totalStudents, activeStudents, todayPickup, todayDropoff,
        pendingMaintenance,
        totalMaintenanceCost: totalMaintenanceCost[0]?.total || 0,
        totalFuelCost: totalFuelCost[0]?.total || 0,
      },
      studentsByRoute, monthlyFuel, monthlyMaintenance, expiryWarnings,
    })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════
exports.listRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query
    const filter = {}
    if (search) filter.$or = [
      { routeName: { $regex: search, $options: 'i' } },
      { routeCode: { $regex: search, $options: 'i' } },
      { startPoint: { $regex: search, $options: 'i' } },
    ]
    if (status) filter.status = status
    const [data, total] = await Promise.all([
      paginate(
        TransportRoute.find(filter)
          .populate('vehicle', 'vehicleNumber vehicleType')
          .populate('driver', 'name phone')
          .populate('helper', 'name phone')
          .sort({ routeCode: 1 }),
        page, limit
      ),
      TransportRoute.countDocuments(filter),
    ])
    ok(res, { data, total, page: +page, limit: +limit })
  } catch (e) { err(res, e) }
}

exports.createRoute = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const route = await TransportRoute.create({ ...body, createdBy: req.user._id })
    ok(res, route, 201)
  } catch (e) { err(res, e) }
}

exports.updateRoute = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const route = await TransportRoute.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
    if (!route) return res.status(404).json({ message: 'Route not found' })
    ok(res, route)
  } catch (e) { err(res, e) }
}

exports.deleteRoute = async (req, res) => {
  try {
    const used = await StudentTransport.countDocuments({ route: req.params.id, status: 'active' })
    if (used > 0) return res.status(400).json({ message: `Cannot delete: ${used} active student(s) on this route` })
    await TransportRoute.findByIdAndDelete(req.params.id)
    ok(res, { message: 'Route deleted' })
  } catch (e) { err(res, e) }
}

exports.getRoute = async (req, res) => {
  try {
    const route = await TransportRoute.findById(req.params.id)
      .populate('vehicle', 'vehicleNumber vehicleType seatingCapacity')
      .populate('driver', 'name phone licenseNumber')
      .populate('helper', 'name phone')
    if (!route) return res.status(404).json({ message: 'Route not found' })
    const stops = await RouteStop.find({ route: req.params.id }).sort({ stopOrder: 1 })
    const studentCount = await StudentTransport.countDocuments({ route: req.params.id, status: 'active' })
    ok(res, { route, stops, studentCount })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE STOPS
// ══════════════════════════════════════════════════════════════════════════════
exports.listRouteStops = async (req, res) => {
  try {
    const { routeId, status } = req.query
    const filter = {}
    if (routeId) filter.route = routeId
    if (status) filter.status = status
    const data = await RouteStop.find(filter)
      .populate('route', 'routeName routeCode')
      .sort({ stopOrder: 1 })
    ok(res, { data, total: data.length })
  } catch (e) { err(res, e) }
}

exports.createRouteStop = async (req, res) => {
  try {
    if (!req.body.stopOrder) {
      const count = await RouteStop.countDocuments({ route: req.body.route })
      req.body.stopOrder = count + 1
    }
    const stop = await RouteStop.create(req.body)
    ok(res, stop, 201)
  } catch (e) { err(res, e) }
}

exports.updateRouteStop = async (req, res) => {
  try {
    const stop = await RouteStop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!stop) return res.status(404).json({ message: 'Stop not found' })
    ok(res, stop)
  } catch (e) { err(res, e) }
}

exports.deleteRouteStop = async (req, res) => {
  try {
    const used = await StudentTransport.countDocuments({
      $or: [{ pickupStop: req.params.id }, { dropoffStop: req.params.id }],
      status: 'active',
    })
    if (used > 0) return res.status(400).json({ message: `Cannot delete: stop is assigned to ${used} active student(s)` })
    await RouteStop.findByIdAndDelete(req.params.id)
    ok(res, { message: 'Stop deleted' })
  } catch (e) { err(res, e) }
}

exports.reorderStops = async (req, res) => {
  try {
    const stops = Array.isArray(req.body.stops) ? req.body.stops : []
    if (stops.length === 0) return res.status(400).json({ message: 'No stops to reorder' })
    const stopIds = stops.map(s => s._id)
    if (stopIds.some(id => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'Invalid stop ID' })
    }
    const existingStops = await RouteStop.find({ _id: { $in: stopIds } }).select('_id route')
    if (existingStops.length !== stops.length) {
      return res.status(400).json({ message: 'One or more stops were not found' })
    }
    const routeIds = new Set(existingStops.map(s => s.route.toString()))
    if (routeIds.size !== 1) return res.status(400).json({ message: 'Stops must belong to one route' })
    const ops = stops.map(s =>
      RouteStop.findByIdAndUpdate(s._id, { stopOrder: s.stopOrder })
    )
    await Promise.all(ops)
    ok(res, { message: 'Stops reordered' })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// VEHICLES
// ══════════════════════════════════════════════════════════════════════════════
exports.listVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, type } = req.query
    const filter = {}
    if (search) filter.$or = [
      { vehicleNumber: { $regex: search, $options: 'i' } },
      { vehicleModel:  { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
    ]
    if (status) filter.status = status
    if (type)   filter.vehicleType = type
    const [data, total] = await Promise.all([
      paginate(
        Vehicle.find(filter)
          .populate('assignedRoute', 'routeName routeCode')
          .populate('assignedDriver', 'name phone')
          .sort({ createdAt: -1 }),
        page, limit
      ),
      Vehicle.countDocuments(filter),
    ])
    const thirtyDays = new Date(Date.now() + 30*86400000)
    const enriched = data.map(v => {
      const obj = v.toObject()
      obj.insuranceWarning = v.insuranceExpiry && v.insuranceExpiry <= thirtyDays
      obj.taxWarning       = v.taxExpiry       && v.taxExpiry       <= thirtyDays
      obj.fitnessWarning   = v.fitnessExpiry   && v.fitnessExpiry   <= thirtyDays
      obj.insuranceDays    = daysUntil(v.insuranceExpiry)
      obj.taxDays          = daysUntil(v.taxExpiry)
      obj.fitnessDays      = daysUntil(v.fitnessExpiry)
      return obj
    })
    ok(res, { data: enriched, total, page: +page, limit: +limit })
  } catch (e) { err(res, e) }
}

exports.createVehicle = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const vehicle = await Vehicle.create({ ...body, createdBy: req.user._id })
    ok(res, vehicle, 201)
  } catch (e) { err(res, e) }
}

exports.updateVehicle = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
    ok(res, vehicle)
  } catch (e) { err(res, e) }
}

exports.deleteVehicle = async (req, res) => {
  try {
    const assigned = await StudentTransport.countDocuments({ vehicle: req.params.id, status: 'active' })
    if (assigned > 0) return res.status(400).json({ message: `Cannot delete: ${assigned} student(s) assigned to this vehicle` })
    await Vehicle.findByIdAndDelete(req.params.id)
    ok(res, { message: 'Vehicle deleted' })
  } catch (e) { err(res, e) }
}

exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedRoute', 'routeName routeCode')
      .populate('assignedDriver', 'name phone licenseNumber licenseExpiry')
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
    const [maintenance, fuel, studentCount] = await Promise.all([
      VehicleMaintenance.find({ vehicle: req.params.id }).sort({ serviceDate: -1 }).limit(5),
      FuelRecord.find({ vehicle: req.params.id }).sort({ date: -1 }).limit(5),
      StudentTransport.countDocuments({ vehicle: req.params.id, status: 'active' }),
    ])
    ok(res, { vehicle, maintenance, fuel, studentCount })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// DRIVERS
// ══════════════════════════════════════════════════════════════════════════════
exports.listDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query
    const filter = {}
    if (search) filter.$or = [
      { name:          { $regex: search, $options: 'i' } },
      { phone:         { $regex: search, $options: 'i' } },
      { licenseNumber: { $regex: search, $options: 'i' } },
      { employeeId:    { $regex: search, $options: 'i' } },
    ]
    if (status) filter.status = status
    const [data, total] = await Promise.all([
      paginate(
        Driver.find(filter)
          .populate('assignedVehicle', 'vehicleNumber vehicleType')
          .populate('assignedRoute', 'routeName routeCode')
          .sort({ name: 1 }),
        page, limit
      ),
      Driver.countDocuments(filter),
    ])
    const thirtyDays = new Date(Date.now() + 30*86400000)
    const enriched = data.map(d => {
      const obj = d.toObject()
      obj.licenseExpired = d.licenseExpiry && d.licenseExpiry < new Date()
      obj.licenseWarning = d.licenseExpiry && d.licenseExpiry <= thirtyDays && d.licenseExpiry >= new Date()
      obj.licenseDays    = daysUntil(d.licenseExpiry)
      return obj
    })
    ok(res, { data: enriched, total, page: +page, limit: +limit })
  } catch (e) { err(res, e) }
}

exports.createDriver = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const driver = await Driver.create({ ...body, createdBy: req.user._id })
    ok(res, driver, 201)
  } catch (e) { err(res, e) }
}

exports.updateDriver = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const driver = await Driver.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
    if (!driver) return res.status(404).json({ message: 'Driver not found' })
    ok(res, driver)
  } catch (e) { err(res, e) }
}

exports.deleteDriver = async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id)
    ok(res, { message: 'Driver deleted' })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// VEHICLE STAFF
// ══════════════════════════════════════════════════════════════════════════════
exports.listVehicleStaff = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query
    const filter = {}
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ]
    if (status) filter.status = status
    const [data, total] = await Promise.all([
      paginate(
        VehicleStaff.find(filter)
          .populate('assignedVehicle', 'vehicleNumber vehicleType')
          .populate('assignedRoute', 'routeName routeCode')
          .sort({ name: 1 }),
        page, limit
      ),
      VehicleStaff.countDocuments(filter),
    ])
    ok(res, { data, total, page: +page, limit: +limit })
  } catch (e) { err(res, e) }
}

exports.createVehicleStaff = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const staff = await VehicleStaff.create({ ...body, createdBy: req.user._id })
    ok(res, staff, 201)
  } catch (e) { err(res, e) }
}

exports.updateVehicleStaff = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const staff = await VehicleStaff.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
    if (!staff) return res.status(404).json({ message: 'Staff not found' })
    ok(res, staff)
  } catch (e) { err(res, e) }
}

exports.deleteVehicleStaff = async (req, res) => {
  try {
    await VehicleStaff.findByIdAndDelete(req.params.id)
    ok(res, { message: 'Staff deleted' })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT TRANSPORT
// ══════════════════════════════════════════════════════════════════════════════
exports.searchStudents = async (req, res) => {
  try {
    const { q = '' } = req.query
    if (q.length < 2) return ok(res, [])
    const data = await Admission.find({
      status: 'approved',
      $or: [
        { studentName: { $regex: q, $options: 'i' } },
        { phone:       { $regex: q, $options: 'i' } },
      ],
    }).select('studentName classApplying phone parentName').limit(10)
    ok(res, data)
  } catch (e) { err(res, e) }
}

exports.listStudentTransport = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, routeId } = req.query
    const filter = {}
    if (status)  filter.status = status
    if (routeId) filter.route  = routeId
    if (search) {
      const students = await Admission.find({
        $or: [
          { studentName:    { $regex: search, $options: 'i' } },
          { classApplying:  { $regex: search, $options: 'i' } },
        ]
      }).select('_id').limit(100)
      filter.student = { $in: students.map(s => s._id) }
    }
    const [data, total] = await Promise.all([
      paginate(
        StudentTransport.find(filter)
          .populate('student', 'studentName classApplying phone parentName')
          .populate('route', 'routeName routeCode')
          .populate('pickupStop', 'stopName pickupTime')
          .populate('dropoffStop', 'stopName dropoffTime')
          .populate('vehicle', 'vehicleNumber vehicleType')
          .populate('driver', 'name phone')
          .sort({ createdAt: -1 }),
        page, limit
      ),
      StudentTransport.countDocuments(filter),
    ])
    ok(res, { data, total, page: +page, limit: +limit })
  } catch (e) { err(res, e) }
}

exports.assignTransport = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    if (!mongoose.isValidObjectId(body.route)) {
      return res.status(400).json({ message: 'Invalid route' })
    }
    const route = await TransportRoute.findById(body.route).select('_id')
    if (!route) return res.status(400).json({ message: 'Invalid route' })
    const stopIds = [body.pickupStop, body.dropoffStop].filter(Boolean)
    if (stopIds.some(id => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'Invalid stop ID' })
    }
    if (stopIds.length) {
      const validStops = await RouteStop.countDocuments({ _id: { $in: stopIds }, route: body.route })
      if (validStops !== stopIds.length) {
        return res.status(400).json({ message: 'Pickup and drop-off stops must belong to the selected route' })
      }
    }
    await StudentTransport.updateMany(
      { student: body.student, status: 'active' },
      { status: 'inactive', effectiveTo: new Date() }
    )
    const assignment = await StudentTransport.create({
      ...body,
      assignedBy: req.user._id,
      effectiveFrom: body.effectiveFrom || new Date(),
    })
    await assignment.populate([
      { path: 'student', select: 'studentName classApplying phone' },
      { path: 'route',   select: 'routeName routeCode' },
      { path: 'vehicle', select: 'vehicleNumber' },
    ])
    ok(res, assignment, 201)
  } catch (e) { err(res, e) }
}

exports.updateTransport = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    if (body.route || body.pickupStop || body.dropoffStop) {
      const current = await StudentTransport.findById(req.params.id).select('route')
      if (!current) return res.status(404).json({ message: 'Assignment not found' })
      const routeId = body.route || current.route
      const route = await TransportRoute.findById(routeId).select('_id')
      if (!route) return res.status(400).json({ message: 'Invalid route' })
      const stopIds = [body.pickupStop, body.dropoffStop].filter(Boolean)
      if (stopIds.some(id => !mongoose.isValidObjectId(id))) {
        return res.status(400).json({ message: 'Invalid stop ID' })
      }
      if (stopIds.length) {
        const validStops = await RouteStop.countDocuments({ _id: { $in: stopIds }, route: routeId })
        if (validStops !== stopIds.length) {
          return res.status(400).json({ message: 'Pickup and drop-off stops must belong to the selected route' })
        }
      }
    }
    const assignment = await StudentTransport.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })
    ok(res, assignment)
  } catch (e) { err(res, e) }
}

exports.removeTransport = async (req, res) => {
  try {
    await StudentTransport.findByIdAndUpdate(req.params.id, { status: 'inactive', effectiveTo: new Date() })
    ok(res, { message: 'Transport assignment removed' })
  } catch (e) { err(res, e) }
}

exports.getStudentTransportHistory = async (req, res) => {
  try {
    const data = await StudentTransport.find({ student: req.params.studentId })
      .populate('route', 'routeName routeCode')
      .populate('vehicle', 'vehicleNumber')
      .populate('driver', 'name')
      .sort({ createdAt: -1 })
    ok(res, data)
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// PICKUP / DROP-OFF ATTENDANCE
// ══════════════════════════════════════════════════════════════════════════════
exports.getAttendance = async (req, res) => {
  try {
    const { date, routeId } = req.query
    if (!date || !routeId) return res.status(400).json({ message: 'date and routeId are required' })
    const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0)
    const nextDay    = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1)

    const assignments = await StudentTransport.find({ route: routeId, status: 'active' })
      .populate('student', 'studentName classApplying')
      .populate('pickupStop', 'stopName')
      .populate('dropoffStop', 'stopName')

    const existing = await TransportAttendance.find({
      date: { $gte: targetDate, $lt: nextDay },
      route: routeId,
    })

    const students = assignments.filter(a => a.student).map(a => {
      const att = existing.find(e => e.student?.toString() === a.student._id.toString())
      return {
        studentId:    a.student._id,
        studentName:  a.student.studentName,
        class:        a.student.classApplying,
        pickupStop:   a.pickupStop?.stopName  || '',
        dropoffStop:  a.dropoffStop?.stopName || '',
        pickupStatus:  att?.pickupStatus  || 'present',
        dropoffStatus: att?.dropoffStatus || 'present',
        remarks:      att?.remarks || '',
        attendanceId: att?._id || null,
      }
    })

    const route = await TransportRoute.findById(routeId)
      .populate('vehicle', 'vehicleNumber')
      .populate('driver', 'name')
    ok(res, { route, students, date })
  } catch (e) { err(res, e) }
}

exports.saveAttendance = async (req, res) => {
  try {
    const { date, routeId, vehicleId, driverId, helperId, records } = req.body
    const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0)
    if (!date || Number.isNaN(targetDate.getTime()) || !mongoose.isValidObjectId(routeId)) {
      return res.status(400).json({ message: 'Valid date and route are required' })
    }
    const assignedStudents = await StudentTransport.find({
      route: routeId,
      status: 'active',
      student: { $in: (records || []).map(r => r.studentId).filter(mongoose.isValidObjectId) },
    }).select('student')
    const assignedIds = new Set(assignedStudents.map(s => s.student.toString()))
    const invalidStudent = (records || []).find(r => !assignedIds.has(String(r.studentId)))
    if (invalidStudent) return res.status(400).json({ message: 'Attendance includes a student not assigned to this route' })

    // Only include vehicleId/driverId/helperId if they are non-empty valid strings
    const extraFields = {}
    if (vehicleId) extraFields.vehicle = vehicleId
    if (driverId)  extraFields.driver  = driverId
    if (helperId)  extraFields.helper  = helperId

    const ops = (records || []).map(r => ({
      updateOne: {
        filter: { date: targetDate, route: routeId, student: r.studentId },
        update: {
          $set: {
            ...extraFields,
            pickupStatus:  r.pickupStatus  || 'present',
            dropoffStatus: r.dropoffStatus || 'present',
            remarks:  r.remarks || '',
            recordedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }))
    if (ops.length === 0) return res.status(400).json({ message: 'No records to save' })
    await TransportAttendance.bulkWrite(ops)
    ok(res, { message: `Attendance saved for ${records.length} student(s)` })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// VEHICLE MAINTENANCE
// ══════════════════════════════════════════════════════════════════════════════
exports.listMaintenance = async (req, res) => {
  try {
    const { page = 1, limit = 20, vehicleId, type } = req.query
    const filter = {}
    if (vehicleId) filter.vehicle = vehicleId
    if (type) filter.maintenanceType = type
    const [data, total, agg] = await Promise.all([
      paginate(
        VehicleMaintenance.find(filter)
          .populate('vehicle', 'vehicleNumber vehicleType')
          .populate('recordedBy', 'name')
          .sort({ serviceDate: -1 }),
        page, limit
      ),
      VehicleMaintenance.countDocuments(filter),
      VehicleMaintenance.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$cost' } } }]),
    ])
    ok(res, { data, total, page: +page, limit: +limit, totalCost: agg[0]?.total || 0 })
  } catch (e) { err(res, e) }
}

exports.createMaintenance = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const { vehicleStatus, ...rest } = body
    const record = await VehicleMaintenance.create({ ...rest, recordedBy: req.user._id })
    if (vehicleStatus && vehicleStatus !== '') {
      await Vehicle.findByIdAndUpdate(rest.vehicle, { status: vehicleStatus })
    }
    ok(res, record, 201)
  } catch (e) { err(res, e) }
}

exports.updateMaintenance = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const { vehicleStatus, ...rest } = body
    const record = await VehicleMaintenance.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true })
    if (!record) return res.status(404).json({ message: 'Record not found' })
    if (vehicleStatus && vehicleStatus !== '') {
      await Vehicle.findByIdAndUpdate(record.vehicle, { status: vehicleStatus })
    }
    ok(res, record)
  } catch (e) { err(res, e) }
}

exports.deleteMaintenance = async (req, res) => {
  try {
    await VehicleMaintenance.findByIdAndDelete(req.params.id)
    ok(res, { message: 'Record deleted' })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// FUEL RECORDS
// ══════════════════════════════════════════════════════════════════════════════
exports.listFuel = async (req, res) => {
  try {
    const { page = 1, limit = 20, vehicleId, from, to } = req.query
    const filter = {}
    if (vehicleId && !mongoose.isValidObjectId(vehicleId)) {
      return res.status(400).json({ message: 'Invalid vehicle ID' })
    }
    if (vehicleId) filter.vehicle = vehicleId
    if (from || to) {
      filter.date = {}
      const fromDate = from ? new Date(from) : null
      const toDate = to ? new Date(to) : null
      if (from && Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: 'Invalid from date' })
      }
      if (to && Number.isNaN(toDate.getTime())) {
        return res.status(400).json({ message: 'Invalid to date' })
      }
      if (fromDate && toDate && fromDate > toDate) {
        return res.status(400).json({ message: 'From date cannot be after to date' })
      }
      if (fromDate) filter.date.$gte = fromDate
      if (toDate) {
        const endDate = new Date(toDate)
        endDate.setDate(endDate.getDate() + 1)
        filter.date.$lt = endDate
      }
    }
    const [data, total, agg] = await Promise.all([
      paginate(
        FuelRecord.find(filter)
          .populate('vehicle', 'vehicleNumber vehicleType')
          .populate('driver', 'name')
          .sort({ date: -1 }),
        page, limit
      ),
      FuelRecord.countDocuments(filter),
      FuelRecord.aggregate([
        { $match: filter },
        { $group: { _id: null, totalCost: { $sum: '$totalCost' }, totalQty: { $sum: '$quantity' } } },
      ]),
    ])
    ok(res, { data, total, page: +page, limit: +limit, totalCost: agg[0]?.totalCost || 0, totalQty: agg[0]?.totalQty || 0 })
  } catch (e) { err(res, e) }
}

exports.createFuel = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const record = await FuelRecord.create({ ...body, recordedBy: req.user._id })
    ok(res, record, 201)
  } catch (e) { err(res, e) }
}

exports.updateFuel = async (req, res) => {
  try {
    const body = cleanBody(req.body)
    if (body.quantity !== undefined || body.ratePerUnit !== undefined) {
      const existing = await FuelRecord.findById(req.params.id)
      if (existing) {
        const qty  = body.quantity    !== undefined ? body.quantity    : existing.quantity
        const rate = body.ratePerUnit !== undefined ? body.ratePerUnit : existing.ratePerUnit
        body.totalCost = +(qty * rate).toFixed(2)
      }
    }
    const record = await FuelRecord.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
    if (!record) return res.status(404).json({ message: 'Record not found' })
    ok(res, record)
  } catch (e) { err(res, e) }
}

exports.deleteFuel = async (req, res) => {
  try {
    await FuelRecord.findByIdAndDelete(req.params.id)
    ok(res, { message: 'Record deleted' })
  } catch (e) { err(res, e) }
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════════
exports.getReports = async (req, res) => {
  try {
    const { type = 'summary', routeId, vehicleId, from, to, status, search = '' } = req.query
    const dateFilter = {}
    if (routeId && !mongoose.isValidObjectId(routeId)) {
      return res.status(400).json({ message: 'Invalid route ID' })
    }
    if (vehicleId && !mongoose.isValidObjectId(vehicleId)) {
      return res.status(400).json({ message: 'Invalid vehicle ID' })
    }
    const fromDate = from ? new Date(from) : null
    const toDate = to ? new Date(to) : null
    if (from && Number.isNaN(fromDate.getTime())) {
      return res.status(400).json({ message: 'Invalid from date' })
    }
    if (to && Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid to date' })
    }
    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({ message: 'From date cannot be after to date' })
    }
    if (fromDate) dateFilter.$gte = fromDate
    if (to) {
      const endDate = new Date(toDate)
      endDate.setDate(endDate.getDate() + 1)
      dateFilter.$lt = endDate
    }

    // ── Summary ──
    if (type === 'summary') {
      const [totalVehicles, totalRoutes, totalStudents, totalDrivers, maintAgg, fuelAgg] = await Promise.all([
        Vehicle.countDocuments(),
        TransportRoute.countDocuments({ status: 'active' }),
        StudentTransport.countDocuments({ status: 'active' }),
        Driver.countDocuments({ status: 'active' }),
        VehicleMaintenance.aggregate([{ $group: { _id: null, t: { $sum: '$cost' } } }]),
        FuelRecord.aggregate([{ $group: { _id: null, t: { $sum: '$totalCost' } } }]),
      ])
      return ok(res, {
        totalVehicles, totalRoutes, totalStudents, totalDrivers,
        totalMaintCost: maintAgg[0]?.t || 0,
        totalFuelCost:  fuelAgg[0]?.t  || 0,
      })
    }

    // ── Students ──
    if (type === 'students') {
      const filter = {}
      if (routeId) filter.route = routeId
      if (status) filter.status = status
      if (search) {
        const students = await Admission.find({
          $or: [
            { studentName: { $regex: search, $options: 'i' } },
            { classApplying: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        }).select('_id').limit(100)
        filter.student = { $in: students.map(student => student._id) }
      }
      const [data, total] = await Promise.all([
        StudentTransport.find(filter)
        .populate('student', 'studentName classApplying phone parentName')
        .populate('route', 'routeName routeCode')
        .populate('pickupStop', 'stopName')
        .populate('dropoffStop', 'stopName')
        .populate('vehicle', 'vehicleNumber')
        .sort({ createdAt: -1 }),
        StudentTransport.countDocuments(filter),
      ])
      return ok(res, { data, total })
    }

    // ── Route Report ──
    if (type === 'route') {
      const routeFilter = {}
      if (routeId) routeFilter._id = routeId
      if (status) routeFilter.status = status
      const routeList = await TransportRoute.find(routeFilter)
        .populate('vehicle', 'vehicleNumber')
        .populate('driver', 'name')
        .sort({ routeCode: 1 })
      const result = await Promise.all(routeList.map(async r => {
        const [stops, students] = await Promise.all([
          RouteStop.countDocuments({ route: r._id }),
          StudentTransport.countDocuments({ route: r._id, status: 'active' }),
        ])
        return { ...r.toObject(), stops, students }
      }))
      return ok(res, { data: result, total: result.length })
    }

    // ── Maintenance ──
    if (type === 'maintenance') {
      const filter = {}
      if (vehicleId) filter.vehicle = vehicleId
      if (Object.keys(dateFilter).length) filter.serviceDate = dateFilter
      const data = await VehicleMaintenance.find(filter)
        .populate('vehicle', 'vehicleNumber vehicleType')
        .sort({ serviceDate: -1 })
      const totalCost = data.reduce((s, d) => s + (d.cost || 0), 0)
      return ok(res, { data, total: data.length, totalCost })
    }

    // ── Fuel ──
    if (type === 'fuel') {
      const filter = {}
      if (vehicleId) filter.vehicle = vehicleId
      if (Object.keys(dateFilter).length) filter.date = dateFilter
      const data = await FuelRecord.find(filter)
        .populate('vehicle', 'vehicleNumber vehicleType')
        .populate('driver', 'name')
        .sort({ date: -1 })
      const totalCost = data.reduce((s, d) => s + (d.totalCost || 0), 0)
      const totalQty  = data.reduce((s, d) => s + (d.quantity  || 0), 0)
      return ok(res, { data, total: data.length, totalCost, totalQty })
    }

    ok(res, { data: [], total: 0 })
  } catch (e) { err(res, e) }
}

// Transport fees summary
exports.getTransportFeesSummary = async (req, res) => {
  try {
    const totalStudents = await StudentTransport.countDocuments({ status: 'active' })
    const feeAgg = await StudentTransport.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$transportFee' }, avg: { $avg: '$transportFee' } } },
    ])
    ok(res, {
      totalStudents,
      totalMonthlyFees: feeAgg[0]?.total || 0,
      avgFee: Math.round(feeAgg[0]?.avg || 0),
    })
  } catch (e) { err(res, e) }
}
