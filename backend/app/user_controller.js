const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const db = require("./database")
const validator = require("./validator")
const status = require("./status")

// Helper functions.
const controller_helper = require("./controller_helper")
const hashPassword = controller_helper.hashPassword
const checkGroup = controller_helper.checkGroup
const getUserGroups = controller_helper.getUserGroups
const doesGroupsExist = controller_helper.doesGroupsExist
const checkEnabled = controller_helper.checkEnabled
const checkRole = controller_helper.checkRole

// User login.
async function doLogin(req, res) {
  try {
    // Retrieve username and password.
    let { username, password } = req.body

    /* Query from the dataabase.
        Because username and password are untrusted data from the end user, we cannot add it directly to the query in case of injection attacks.
        We instead use ?, and then pass in the values as an array. */
    const statement = `SELECT user_username, user_password, user_email, user_enabled FROM user where user_username=?;`
    const [rows] = await db.query(statement, [username]) // The [rows] syntax means that we only want the first element of the result array.

    // User not found.
    if (rows.length == 0) throw `Login: User ${username} does not exist.`
    // User not enabled.
    if (!rows[0].user_enabled) throw `Login: User ${username} is disabled.`
    // Invalid password.
    const isValidPassword = await bcrypt.compare(password, rows[0].user_password)
    if (!isValidPassword) throw `Login: User ${username} has invalid password.`

    // What is the user's IP address and browser?
    const ipAddress = req.connection.remoteAddress
    const userAgent = req.get("User-Agent")

    // Create user object.
    const user = {
      username: rows[0].user_username,
      email: rows[0].user_email,
      ipAddress,
      userAgent,
    }

    // Sign a JSON Web Token (JWT).
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)

    // Check for hardcoded groups.
    const isAdmin = await checkGroup(user.username, process.env.GROUP_ADMIN)
    const isAppCreator = await checkGroup(user.username, process.env.GROUP_APP_CREATOR)
    const isPlanCreator = await checkGroup(user.username, process.env.GROUP_PLAN_CREATOR)

    // Return the JWT to the user.
    console.log(`Login: User ${username} logged in successfully.`)

    res.status(status.ok).json({
      message: "Login successful.",
      token,
      username: rows[0].user_username,
      email: rows[0].user_email,
      isAdmin,
      isAppCreator,
      isPlanCreator,
    })
  } catch (e) {
    console.log(e)
    res.status(status.unauthorised).send()
  }
}

// Get hardcoded groups of a user.
async function doAuthenticate(req, res) {
  const username = req.user.username
  try {
    res.status(status.ok).json({
      message: "Authentication checked.",
      username,
      enabled: await checkEnabled(username),
      isAdmin: await checkGroup(username, process.env.GROUP_ADMIN),
      isAppCreator: await checkGroup(username, process.env.GROUP_APP_CREATOR),
      isPlanCreator: await checkGroup(username, process.env.GROUP_PLAN_CREATOR),
    })
  } catch (e) {
    console.log(e)
    res.status(status.unauthorised).json({
      message: "Permission denied.",
      username,
      enabled: false,
      isAdmin: false,
      isAppCreator: false,
      isPlanCreator: false,
    })
  }
}

// Update user. (Non-admin)
async function doUpdateUser(req, res) {
  try {
    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Update user: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    const username = req.user.username
    const { type } = req.body

    // Update email.
    if (type == "email") {
      const { email } = req.body
      if (!validator.isValidEmail(email)) {
        console.log(`Update user: User ${username} has invalid email format.`)
        res.status(status.error).json({ message: "Invalid email format." })
        return
      }

      const statement = `UPDATE user SET user_email=? WHERE user_username=?;`
      const [result] = await db.query(statement, [email, username])

      // Check if successful.
      if (result.affectedRows != 1) {
        console.log(`Update user: User ${username} does not exist.`)
        res.status(status.error).json({ message: "User does not exist." })
        return
      }

      console.log(`Update user: User ${username} has updated email successfully.`)
      res.status(status.ok).json({ message: "Email updated." })
    }

    // Update password.
    else if (type == "password") {
      const { password } = req.body
      if (!validator.isValidPassword(password)) {
        console.log(`Update user: User ${username} has invalid password format.`)
        res.status(status.error).json({ message: "Invalid password format. Length 8 to 10. Only alphanumeric and special characters." })
        return
      }

      // Encrypt the password so that we are not storing plaintext.
      const statement = `UPDATE user SET user_password=? WHERE user_username=?;`
      const [result] = await db.query(statement, [hashPassword(password), username])

      // Check if successful.
      if (result.affectedRows != 1) {
        console.log(`Update user: User ${username} does not exist.`)
        res.status(status.error).json({ message: "User does not exist." })
        return
      }

      console.log(`Update user: User ${username} has updated password successfully.`)
      res.status(status.ok).json({ message: "Password updated." })
    }

    // Invalid action.
    else {
      console.log(`Update user: User ${username} has invalid update action.`)
      res.status(status.error).json({ message: "Invalid action." })
    }
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
  }
}

// Get all groups.
async function doGetGroups(req, res) {
  try {
    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Admin retrieve groups: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    const statement = `SELECT * FROM tag;`
    const [rows] = await db.query(statement)
    const groups = rows.map((element) => element.tag_name)

    console.log(`Admin retrieve groups: Success.`)
    res.status(status.ok).json({ message: "Fetch groups success.", groups })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
  }
}

module.exports = { doLogin, doAuthenticate, doUpdateUser, doGetGroups }
