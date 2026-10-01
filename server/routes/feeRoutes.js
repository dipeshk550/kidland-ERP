const router = require('express').Router()
const { protect, authorize } = require('../middleware/authMiddleware')
const f = require('../controllers/feeController')

router.use(protect, authorize('fees'))

// Fee Groups
router.route('/groups').get(f.listFeeGroups).post(f.createFeeGroup)
router.route('/groups/:id').put(f.updateFeeGroup).delete(f.deleteFeeGroup)

// Fee Types
router.route('/types').get(f.listFeeTypes).post(f.createFeeType)
router.route('/types/:id').put(f.updateFeeType).delete(f.deleteFeeType)

// Fee Master
router.route('/masters').get(f.listFeeMasters).post(f.createFeeMaster)
router.route('/masters/:id').put(f.updateFeeMaster).delete(f.deleteFeeMaster)

// Payments (Collect Fees + Search)
router.route('/payments').get(f.listPayments).post(f.collectFee)
router.route('/payments/:id').get(f.getPayment).delete(f.cancelPayment)

// Student fee account (for Collect Fees page)
router.get('/student/search', f.searchStudents)
router.get('/student/:admissionId', f.getStudentFeeAccount)

// Statement
router.get('/statement/:admissionId', f.getStatement)

// Fees Due
router.get('/due', f.getFeesDue)

// Discounts
router.route('/discounts').get(f.listDiscounts).post(f.createDiscount)
router.route('/discounts/:id').put(f.updateDiscount).delete(f.deleteDiscount)

// Reports
router.get('/reports/daily',   f.getDailyReport)
router.get('/reports/monthly', f.getMonthlySummary)
router.get('/reports/summary', f.getReportsSummary)

module.exports = router
