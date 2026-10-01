const { Notification } = require('../models')
exports.list = async (req, res) => {
  try {
    const data = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(Math.min(Number(req.query.limit) || 50, 100))
    res.json({ data, unread: await Notification.countDocuments({ recipient: req.user._id, readAt: null }) })
  } catch (e) { res.status(500).json({ message: e.message }) }
}
exports.read = async (req, res) => {
  try {
    const data = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { readAt: new Date() }, { new: true })
    if (!data) return res.status(404).json({ message: 'Notification not found' })
    res.json({ data })
  } catch (e) { res.status(400).json({ message: e.message }) }
}
