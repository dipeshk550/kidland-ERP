const router = require('express').Router()
const { protect, authorize } = require('../middleware/authMiddleware')
const t = require('../controllers/transportController')

router.use(protect, authorize('transport'))

// Dashboard
router.get('/dashboard', t.getDashboard)

// Routes
router.route('/routes').get(t.listRoutes).post(t.createRoute)
router.route('/routes/:id').get(t.getRoute).put(t.updateRoute).delete(t.deleteRoute)

// Route Stops
router.route('/stops').get(t.listRouteStops).post(t.createRouteStop)
router.route('/stops/reorder').put(t.reorderStops)
router.route('/stops/:id').put(t.updateRouteStop).delete(t.deleteRouteStop)

// Vehicles
router.route('/vehicles').get(t.listVehicles).post(t.createVehicle)
router.route('/vehicles/:id').get(t.getVehicle).put(t.updateVehicle).delete(t.deleteVehicle)

// Drivers
router.route('/drivers').get(t.listDrivers).post(t.createDriver)
router.route('/drivers/:id').put(t.updateDriver).delete(t.deleteDriver)

// Vehicle Staff (Helpers)
router.route('/staff').get(t.listVehicleStaff).post(t.createVehicleStaff)
router.route('/staff/:id').put(t.updateVehicleStaff).delete(t.deleteVehicleStaff)

// Student Transport
router.get('/students/search', t.searchStudents)
router.get('/students/:studentId/history', t.getStudentTransportHistory)
router.route('/students').get(t.listStudentTransport).post(t.assignTransport)
router.route('/students/:id').put(t.updateTransport).delete(t.removeTransport)

// Transport Fees Summary
router.get('/fees-summary', t.getTransportFeesSummary)

// Pickup / Drop-off Attendance
router.get('/attendance', t.getAttendance)
router.post('/attendance', t.saveAttendance)

// Vehicle Maintenance
router.route('/maintenance').get(t.listMaintenance).post(t.createMaintenance)
router.route('/maintenance/:id').put(t.updateMaintenance).delete(t.deleteMaintenance)

// Fuel Records
router.route('/fuel').get(t.listFuel).post(t.createFuel)
router.route('/fuel/:id').put(t.updateFuel).delete(t.deleteFuel)

// Reports
router.get('/reports', t.getReports)

module.exports = router
