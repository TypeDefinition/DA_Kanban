const bcrypt = require("bcryptjs")
const nodemailer = require("nodemailer")

const db = require("./database")
const validator = require("./validator")
const status = require("./status")

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

// Encrypt the password so that we are not storing plaintext.
function hashPassword(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(Number(process.env.PASSWORD_SALT)))
}

async function checkGroup(username, group) {
  if (!group) return false
  try {
    const statement = `SELECT * FROM tagging WHERE tagging_user=? AND tagging_tag=?;`
    const [rows] = await db.query(statement, [username, group])
    return 1 == rows.length
  } catch (e) {
    console.log(e)
    return false
  }
}

async function getUserGroups(username) {
  try {
    const statement = `SELECT * FROM tagging WHERE tagging_user=?;`
    const [rows] = await db.query(statement, [username])
    return rows.map((element) => element.tagging_tag)
  } catch (e) {
    console.log(e)
    return []
  }
}

async function doesGroupsExist(groups) {
  // Retrieve all groups from database and add them to a set.
  const [rows] = await db.query(`SELECT * from tag;`)
  const groupSet = new Set()
  for (let i = 0; i < rows.length; ++i) {
    groupSet.add(rows[i].tag_name)
  }

  // Check that all the groups in the argument exists in the database.
  for (let i = 0; i < groups.length; ++i) {
    if ("string" != typeof groups[i]) return false
    if (!groupSet.has(groups[i])) return false
  }

  return true
}

async function checkEnabled(username) {
  try {
    const statement = `SELECT user_enabled FROM user WHERE user_username=?;`
    const [rows] = await db.query(statement, [username])
    if (1 != rows.length) throw `Check enabled: User ${username} does not exist.`

    return Boolean(rows[0].user_enabled)
  } catch (e) {
    console.log(e)
  }
  return false
}

async function checkRole(acronym, username, taskState) {
  try {
    const [rows] = await db.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (rows.length !== 1) return false

    const app = rows[0]
    switch (taskState) {
      case "create":
        return await checkGroup(username, app.app_permit_create)
      case "open":
        return await checkGroup(username, app.app_permit_open)
      case "todo":
        return await checkGroup(username, app.app_permit_todolist)
      case "doing":
        return await checkGroup(username, app.app_permit_doing)
      case "done":
        return await checkGroup(username, app.app_permit_done)
      default:
        return false
    }
  } catch (e) {
    console.log(e)
  }
  return false
}

module.exports = { sendEmail, hashPassword, checkGroup, getUserGroups, doesGroupsExist, checkEnabled, checkRole }
