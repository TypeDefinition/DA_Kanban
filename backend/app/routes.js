// External Imports
const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Internal Imports
const db = require("./database")
const validator = require("./validator")

const router = express.Router()

function authToken(req, res, next) {
  const { token } = req.body
  if (token == null) return res.status(400).send()

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user /*What we passed in when signing the token.*/) => {
    if (err) return res.status(400).send() // Error was thrown.
    if (req.connection.remoteAddress != user.ipAddress) return res.status(400).send() // IP Address mismatch.
    if (req.get("User-Agent") != user.userAgent) return res.status(400).send() // Browser mismatch.

    // Pass on the user object to the request.
    req.user = user

    next()
  })
}

function isInGroup(user, group) {
  try {
    const statement = `SELECT * FROM tagging WHERE tagging_user=?, tagging_tag=?;`
    const [rows] = db.query(statement, [user, group])
    return 1 == rows.length
  } catch (e) {
    return false
  }
}

router.post("/login", (req, res) => {
  async function doQuery(req, res) {
    try {
      // Retrieve username and password.
      let { username, password } = req.body

      /* Query from the dataabase.
      Because username and password are untrusted data from the end user, we cannot add it directly to the query in case of injection attacks.
      We instead use ?, and then pass in the values as an array. */
      const statement = `SELECT user_username, user_password, user_enabled FROM user where user_username=?;`
      const [rows] = await db.query(statement, [username]) // The [rows] syntax means that we only want the first element of the result array.

      // User not found.
      if (rows.length == 0) throw `User ${username}: Does not exist.`
      // User not enabled.
      if (!rows[0].user_enabled) throw `User ${username}: Disabled.`
      // Invalid password.
      const validPassword = await bcrypt.compare(password, rows[0].user_password)
      if (!validPassword) throw `User ${username}: Invalid password.`

      const ipAddress = req.connection.remoteAddress // What is the user's IP address?
      const userAgent = req.get("User-Agent") // What is the user's browser?
      const user = { username, ipAddress, userAgent }

      // Sign a JSON Web Token (JWT).
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)

      // Return the JWT to the user.
      console.log(`User ${username}: Login successful.`)
      res.status(200).json({ token })
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

router.post("/user/create", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      if (!isInGroup(req.user.username, "admin")) {
        throw `User ${req.user.username} is not an admin.`
      }

      // Retrieve the username, password and email from the request body and validate them.
      const { username, password, email } = req.body
      if (!validator.isValidUsername(username)) throw `User ${username}: Invalid username format.`
      if (!validator.isValidPassword(password)) throw `User ${username}: Invalid password format.`
      if (!validator.isValidEmail(email)) throw `User ${username}: Invalid email format.`

      // Encrypt the password so that we are not storing plaintext.
      const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(10))

      // Insert into database.
      const statement = `INSERT INTO user (user_username, user_password, user_email, user_enabled) VALUES (?, ?, ?, true);`
      await db.query(statement, [username, passwordHash, email])

      res.status(200).send()
    } catch (e) {
      console.log(e)
      res.status(400).send()
    }
  }
  doQuery(req, res)
})

router.patch("/user-update/:username", authToken, (req, res) => {
  // Only a user can update themselves using this route.
  if (req.user.username != req.params.username) {
    res.status(400).send("Bad request.")
    return
  }

  async function doQuery(req, res) {
    try {
      const { password, email } = req.body
      const statement = `UPDATE account SET password=? email=? WHERE username=?`
      const [result] = await db.query(statement, [password, email, req.params.username])
      if (result.affectedRows == 1) {
        res.status(200).send("User updated.")
      } else {
        res.status(400).send("Bad request.")
      }
    } catch (e) {
      console.log(e.sqlMessage)
      res.status(400).send("Bad request.")
    }
  }
  doQuery(req, res)
})

router.patch("/admin-update/:username", authToken, (req, res) => {
  async function doQuery(req, res) {
    // Check if this is an admin.
    if (!isInGroup(username, "admin")) {
      res.status(400).send("Bad request.")
      return
    }

    try {
      const { password, email, enabled } = req.body
      const statement = `UPDATE account SET password=? email=? enabled=? WHERE username=?`
      const [result] = await db.query(statement, [password, email, enabled, req.params.username])
      if (result.affectedRows == 1) {
        res.status(200).send("User updated.")
      } else {
        res.status(400).send("Bad request.")
      }
    } catch (e) {
      console.log(e.sqlMessage)
      res.status(400).send("Bad request.")
    }
  }
  doQuery(req, res)
})

// View all users.
router.get("/users", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      const statement = `SELECT username, email, enabled FROM account;`
      const [rows] = await db.query(statement)
      res.status(200).send(rows)
    } catch (e) {
      console.log(e.sqlMessage)
      res.status(400).send("Bad request.")
    }
  }
  doQuery(req, res)
})

// View specific user.
router.get("/user/:username", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      const statement = `SELECT username, email FROM account where username=?;`
      const [rows] = await db.query(statement, [req.params.username])

      if (rows.length == 0) {
        res.status(400).send("User not found.")
        return
      }

      res.status(200).send(rows[0])
    } catch (e) {
      console.log(e.sqlMessage)
      res.status(400).send("Bad request.")
    }
  }
  doQuery(req, res)
})

module.exports = router
