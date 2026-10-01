const nodemailer = require('nodemailer')

const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM)
const transporter = configured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
}) : null

exports.sendPasswordReset = async ({ to, name, resetUrl }) => {
  if (!transporter) throw new Error('Password reset email service is not configured')
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Reset your Kidland School password',
    text: `Hello ${name || 'there'},\n\nUse this link to reset your password. It expires in 15 minutes:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Hello ${name || 'there'},</p><p>Use the link below to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
  })
}
