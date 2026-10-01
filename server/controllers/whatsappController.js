const { WhatsappMessage } = require('../models/index')
exports.sendMessage = async (req, res) => {
  try {
    const { senderName, senderPhone, message } = req.body
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' })
    const doc = await WhatsappMessage.create({ senderName:senderName||'Website Visitor', senderPhone:senderPhone||null, message:message.trim(), source:'website_widget', ipAddress:req.ip })
    const phone = process.env.WHATSAPP_NUMBER||'9779841404920'
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`
    res.json({ success:true, messageId:doc._id, waUrl })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.webhookVerify = (req, res) => {
  const { 'hub.mode':mode, 'hub.verify_token':token, 'hub.challenge':challenge } = req.query
  if (mode==='subscribe'&&token===process.env.WA_WEBHOOK_VERIFY_TOKEN) res.status(200).send(challenge)
  else res.status(403).json({ message: 'Verification failed' })
}
exports.webhookReceive = async (req, res) => {
  try {
    const body = req.body
    if (body.object!=='whatsapp_business_account') return res.sendStatus(404)
    const msgs = body.entry?.[0]?.changes?.[0]?.value?.messages
    if (msgs) for (const msg of msgs) {
      if (msg.type!=='text') continue
      await WhatsappMessage.create({ senderName:msg.from, senderPhone:msg.from, message:msg.text?.body||'', source:'whatsapp_webhook', waMessageId:msg.id })
    }
    res.sendStatus(200)
  } catch { res.sendStatus(500) }
}
exports.getMessages = async (req, res) => {
  try {
    const { page=1, limit=20, status } = req.query
    const query = status ? { status } : {}
    const skip = (parseInt(page)-1)*parseInt(limit)
    const [data,total] = await Promise.all([WhatsappMessage.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)), WhatsappMessage.countDocuments(query)])
    res.json({ data, total, page:parseInt(page), pages:Math.ceil(total/parseInt(limit)) })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.markRead = async (req, res) => {
  try { const m = await WhatsappMessage.findByIdAndUpdate(req.params.id,{status:'read'},{new:true}); if(!m) return res.status(404).json({message:'Not found'}); res.json({data:m}) }
  catch(err) { res.status(500).json({ message: err.message }) }
}
exports.replyMessage = async (req, res) => {
  try {
    const { reply } = req.body
    const m = await WhatsappMessage.findByIdAndUpdate(req.params.id,{reply,status:'replied',repliedAt:new Date(),repliedBy:req.user._id},{new:true})
    if (!m) return res.status(404).json({ message: 'Not found' })
    res.json({ data: m, message: 'Reply sent' })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.getStats = async (req, res) => {
  try {
    const [total,unread,read,replied] = await Promise.all([WhatsappMessage.countDocuments(),WhatsappMessage.countDocuments({status:'unread'}),WhatsappMessage.countDocuments({status:'read'}),WhatsappMessage.countDocuments({status:'replied'})])
    res.json({ total, unread, read, replied })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
