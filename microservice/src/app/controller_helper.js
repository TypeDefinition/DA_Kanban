const nodemailer = require("nodemailer")

// Transporter for nodemailer.
const mailTransporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.BACKEND_EMAIL_USERNAME,
    pass: process.env.BACKEND_EMAIL_PASSWORD,
  },
})

async function sendEmail(emails, emailTitle, emailBody) {
  try {
    await mailTransporter.sendMail({
      from: process.env.BACKEND_EMAIL_USERNAME,
      to: emails.join(","),
      subject: emailTitle,
      text: emailBody,
    })
  } catch (e) {
    console.log(e)
  }
}

module.exports = { sendEmail }
