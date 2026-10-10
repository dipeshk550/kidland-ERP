const r = require('express').Router()
const c = require('../controllers/whatsappController')
const { protect, authorize } = require('../middleware/authMiddleware')
const rateLimit = require('express-rate-limit')

const waSendLimit = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 10,                    // max 10 widget messages per IP per 10 min
  message: { message: 'Too many messages sent. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
})

r.post('/send', waSendLimit, c.sendMessage)
r.get('/webhook', c.webhookVerify)
r.post('/webhook', c.webhookReceive)
r.get('/messages', protect, authorize('whatsapp'), c.getMessages)
r.get('/stats', protect, authorize('whatsapp'), c.getStats)
r.put('/messages/:id/read', protect, authorize('whatsapp'), c.markRead)
r.put('/messages/:id/reply', protect, authorize('whatsapp'), c.replyMessage)
module.exports = r
