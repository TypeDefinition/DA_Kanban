// External Imports
const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Internal Imports
const db = require("./database")
const validator = require("./validator")

const router = express.Router()

// Encrypt the password so that we are not storing plaintext.
function hashPassword(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(Number(process.env.PASSWORD_SALT)))
}

function authToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1] // Note: authorization must be in small letters.
  if (token == null) {
    console.log("Authenticate token: Null token.")
    return res.status(400).send()
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user /*What we passed in when signing the token.*/) => {
    if (err) {
      console.log("Authenticate token: Invalid token.")
      return res.status(400).send()
    }
    if (req.connection.remoteAddress != user.ipAddress) {
      console.log(`Authenticate token: User ${user.username} IP address mismatch.`)
      return res.status(400).send()
    }
    if (req.get("User-Agent") != user.userAgent) {
      console.log(`Authenticate token: User ${user.username} user agent mismatch.`)
      return res.status(400).send()
    }

    // Pass on the user object to the request.
    req.user = user
    console.log(`Authenticate token: User ${user.username} authenticated.`)
    next()
  })
}

async function checkGroup(user, group) {
  try {
    const statement = `SELECT * FROM tagging WHERE tagging_user=? AND tagging_tag=?;`
    const [rows] = await db.query(statement, [user, group])
    return 1 == rows.length
  } catch (e) {
    console.log(e)
    return false
  }
}

/******************** User ********************/
// User login.
router.post("/login", (req, res) => {
  async function doQuery(req, res) {
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
      const validPassword = await bcrypt.compare(password, rows[0].user_password)
      if (!validPassword) throw `Login: User ${username} has invalid password.`

      const ipAddress = req.connection.remoteAddress // What is the user's IP address?
      const userAgent = req.get("User-Agent") // What is the user's browser?
      const user = {
        username: rows[0].user_username,
        email: rows[0].user_email,
        ipAddress,
        userAgent,
      }

      // Sign a JSON Web Token (JWT).
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)

      // Return the JWT to the user.
      console.log(`Login: User ${username} logged in.`)
      res.status(200).json({
        token,
        username: rows[0].user_username,
        email: rows[0].user_email,
      })
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

// Update user details.
router.patch("/user/profile", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      const username = req.user.username
      const { type } = req.body

      // Update email.
      if (type == "email") {
        const { email } = req.body
        if (!validator.isValidEmail(email)) throw `Update user: User ${username} has invalid email format.`

        const statement = `UPDATE user SET user_email=? WHERE user_username=?;`
        const [result] = await db.query(statement, [email, username])

        // Throw error if failed.
        if (result.affectedRows != 1) throw `Update user: User ${username} does not exist.`
      }

      // Update password.
      else if (type == "password") {
        const { password } = req.body
        if (!validator.isValidPassword(password)) throw `Update user: User ${username} has invalid password format.`

        // Encrypt the password so that we are not storing plaintext.
        const statement = `UPDATE user SET user_password=? WHERE user_username=?;`
        const [result] = await db.query(statement, [hashPassword(password), username])

        // Throw error if failed.
        if (result.affectedRows != 1) throw `Update user: User ${username} does not exist.`
      }
      // Invalid action.
      else {
        throw `Update user: User ${username} has invalid update action.`
      }

      res.status(200).send()
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

/******************** Admin ********************/
// Get all groups.
router.get("/user/groups", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        throw `Admin retrieve groups: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`
      }

      const statement = `SELECT * FROM tag;`
      const [rows] = await db.query(statement)
      const groups = rows.map((element) => element.tag_name)

      res.status(200).json({ groups })
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

// Create new group.
router.post("/user/groups", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        throw `Admin create group: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`
      }

      const { group } = req.body
      if (!validator.isValidGroup(group)) throw `Admin create group: Group ${group} has invalid name format.`

      // Insert into database.
      const statement = `INSERT INTO tag (tag_name) VALUES (?);`
      await db.query(statement, [group])

      res.status(200).send()
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

// Get all users.
router.get("/user/users", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        throw `Admin retrieve users: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`
      }

      const statement = `SELECT user_username, user_email, user_enabled FROM user;`
      const [rows] = await db.query(statement)
      const users = rows.map((element) => {
        return {
          username: element.user_username,
          email: element.user_email,
          enabled: Boolean(element.user_enabled),
        }
      })

      res.status(200).json({ users })
    } catch (e) {
      {
        console.log(e)
        res.status(400).send()
      }
    }
  }
  doQuery(req, res)
})

// Create new user.
router.post("/user/users", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        throw `Admin create user: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`
      }

      // Retrieve the username, password and email from the request body and validate them.
      const { username, password, email, enabled } = req.body
      if (!validator.isValidUsername(username)) throw `Admin create user: User ${username} has invalid username format.`
      if (!validator.isValidPassword(password)) throw `Admin create user: User ${username} has invalid password format.`
      if (!validator.isValidEmail(email)) throw `Admin create user: User ${username} has invalid email format.`
      if (!validator.isValidEnabled(enabled)) throw `Admin create user: User ${username} has invalid enabled format.`

      // Insert into database.
      const statement = `INSERT INTO user (user_username, user_password, user_email, user_enabled) VALUES (?, ?, ?, ?);`
      await db.query(statement, [username, hashPassword(password), email, enabled])

      res.status(200).send()
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

// Update User
router.patch("/user/users", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        throw `Create user: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`
      }

      // Retrieve the update type.
      const { type, username } = req.body
      if (!validator.isValidUsername(username)) throw `Admin update user: User ${username} has invalid username format.`

      if (type == "update-user") {
        const { email, enabled } = req.body
        if (!validator.isValidEmail(email)) throw `Admin update user: User ${username} has invalid email format.`
        if (!validator.isValidEnabled(enabled)) throw `Admin update user: User ${username} has invalid enabled format.`

        const statement = `UPDATE user SET user_email=?, user_enabled=? WHERE user_username=?`
        await db.query(statement, [email, enabled, username])
      } else if (type == "reset-password") {
        const { password } = req.body
        if (!validator.isValidPassword(password)) throw `Admin update user: User ${username} has invalid password format.`

        const statement = `UPDATE user SET user_password=? WHERE user_username=?`
        await db.query(statement, [hashPassword(password), username])
      } else {
        throw `Admin update user: User ${username} has invalid update action.`
      }

      res.status(200).send()
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

module.exports = router
