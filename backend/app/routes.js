// External Imports
const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Internal Imports
const db = require("./database")
const validator = require("./validator")
const status = require("./status")

const router = express.Router()

// Encrypt the password so that we are not storing plaintext.
function hashPassword(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(Number(process.env.PASSWORD_SALT)))
}

function authToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1] // Note: authorization must be in small letters.
  if (token == null) {
    console.log("Authenticate token: Null token.")
    return res.status(status.unauthorised).send()
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user /*What we passed in when signing the token.*/) => {
    if (err) {
      console.log("Authenticate token: Invalid token.")
      return res.status(status.unauthorised).send()
    }
    if (req.connection.remoteAddress != user.ipAddress) {
      console.log(`Authenticate token: User ${user.username} IP address mismatch.`)
      return res.status(status.unauthorised).send()
    }
    if (req.get("User-Agent") != user.userAgent) {
      console.log(`Authenticate token: User ${user.username} user agent mismatch.`)
      return res.status(status.unauthorised).send()
    }

    // Pass on the user object to the request.
    req.user = user
    console.log(`Authenticate token: User ${user.username} authenticated.`)
    next()
  })
}

async function checkGroup(username, group) {
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
  doQuery(req, res)
})

// Get hardcoded groups of a user.
router.get("/user/authenticate", authToken, (req, res) => {
  async function doQuery(req, res) {
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
  doQuery(req, res)
})

// Update user details.
router.patch("/user/profile", authToken, (req, res) => {
  async function doQuery(req, res) {
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
  doQuery(req, res)
})

/******************** Admin ********************/
// Get all groups.
router.get("/user/groups", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const isEnabled = await checkEnabled(req.user.username)
      if (!isEnabled) {
        console.log(`Admin retrieve groups: ${req.user.username} is not enabled.`)
        res.status(status.unauthorised).send()
        return
      }

      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        console.log(`Admin retrieve groups: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`)
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
  doQuery(req, res)
})

// Create new group.
router.post("/user/groups", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const isEnabled = await checkEnabled(req.user.username)
      if (!isEnabled) {
        console.log(`Admin create group: ${req.user.username} is not enabled.`)
        res.status(status.unauthorised).send()
        return
      }

      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        console.log(`Admin create group: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`)
        res.status(status.unauthorised).send()
        return
      }

      const { group } = req.body
      if (!validator.isValidGroup(group)) {
        console.log(`Admin create group: Group ${group} has invalid name format.`)
        res.status(status.error).json({ message: "Invalid group format. Group name length must be 4 to 32, and only alphanumeric and underscore is allowed." })
        return
      }

      // Insert into database.
      const statement = `INSERT INTO tag (tag_name) VALUES (?);`
      await db.query(statement, [group])

      console.log(`Admin create group: Group ${group} created successfully.`)
      res.status(status.ok).json({ message: "Group created." })
    } catch (e) {
      console.log(e)

      // At this point, most likely is error due to duplicate.
      res.status(status.error).json({ message: "Group already exists." })
    }
  }
  doQuery(req, res)
})

// Retrieve all users.
router.get("/user/users", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const isEnabled = await checkEnabled(req.user.username)
      if (!isEnabled) {
        console.log(`Admin retrieve users: ${req.user.username} is not enabled.`)
        res.status(status.unauthorised).send()
        return
      }

      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        console.log(`Admin retrieve users: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`)
        res.status(status.unauthorised).send()
        return
      }

      // Retrieve user details.
      const userStatement = `SELECT user_username, user_email, user_enabled FROM user;`
      const [userRows] = await db.query(userStatement)
      const users = userRows.map((element) => {
        return {
          username: element.user_username,
          email: element.user_email,
          enabled: Boolean(element.user_enabled),
          groups: [],
        }
      })

      // Retrieve user groups.
      const groupStatement = `SELECT * FROM tagging;`
      const [groupRows] = await db.query(groupStatement)
      const userGroupMap = new Map()
      for (let i = 0; i < groupRows.length; ++i) {
        const key = groupRows[i].tagging_user
        const value = groupRows[i].tagging_tag
        if (userGroupMap.has(key)) {
          userGroupMap.get(key).push(value)
        } else {
          userGroupMap.set(key, [value])
        }
      }

      // Append groups to users.
      for (let i = 0; i < users.length; ++i) {
        const key = users[i].username
        if (userGroupMap.has(key)) {
          users[i].groups = userGroupMap.get(key)
        }
      }

      console.log(`Admin retrieve users: Success.`)
      res.status(status.ok).json({ users })
    } catch (e) {
      {
        console.log(e)
        res.status(status.error).json({ message: "Unknown error." })
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
      const isEnabled = await checkEnabled(req.user.username)
      if (!isEnabled) {
        console.log(`Admin create user: ${req.user.username} is not enabled.`)
        res.status(status.unauthorised).send()
        return
      }

      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        console.log(`Admin create user: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`)
        res.status(status.unauthorised).send()
        return
      }

      // Retrieve the username, password and email from the request body and validate them.
      const { username, password, email, enabled, groups } = req.body

      if (!validator.isValidUsername(username)) {
        console.log(`Admin create user: User ${username} has invalid username format.`)
        res.status(status.error).json({ message: "Invalid username format. Length 4 to 32. Only alphanumeric and underscore." })
        return
      }

      if (!validator.isValidPassword(password)) {
        console.log(`Admin create user: User ${username} has invalid password format.`)
        res.status(status.error).json({ message: "Invalid password format. Length 8 to 10. Only alphanumeric and special characters." })
        return
      }

      if (!validator.isValidEmail(email)) {
        console.log(`Admin create user: User ${username} has invalid email format.`)
        res.status(status.error).json({ message: "Invalid email format." })
        return
      }

      if (!validator.isValidEnabled(enabled)) {
        console.log(`Admin create user: User ${username} has invalid enabled format.`)
        res.status(status.error).json({ message: "Invalid enabled format." })
        return
      }

      // Ensure that the groups exist.
      const groupsExist = await doesGroupsExist(groups)
      if (!groupsExist) {
        console.log(`Admin create user: User ${username} has invalid groups.`)
        res.status(status.error).json({ message: "Invalid groups." })
        return
      }

      // Insert into database.
      await db.query(`INSERT INTO user (user_username, user_password, user_email, user_enabled) VALUES (?, ?, ?, ?);`, [username, hashPassword(password), email, enabled])
      for (let i = 0; i < groups.length; ++i) {
        await db.query(`INSERT INTO tagging (tagging_user, tagging_tag) VALUES (?, ?);`, [username, groups[i]])
      }

      console.log(`Admin create user: User ${username} created successfully.`)
      res.status(status.ok).json({ message: "User created." })
    } catch (e) {
      console.log(e)

      // At this point, most likely is error due to duplicate.
      res.status(status.error).json({ message: "Username already exists." })
    }
  }
  doQuery(req, res)
})

// Update User
router.patch("/user/users", authToken, (req, res) => {
  async function doQuery(req, res) {
    try {
      // Ensure that the current user has sufficient permissions.
      const isEnabled = await checkEnabled(req.user.username)
      if (!isEnabled) {
        console.log(`Admin update user: ${req.user.username} is not enabled.`)
        res.status(status.unauthorised).send()
        return
      }

      const hasPermission = await checkGroup(req.user.username, process.env.GROUP_ADMIN)
      if (!hasPermission) {
        console.log(`Admin update user: ${req.user.username} is not an ${process.env.GROUP_ADMIN}.`)
        res.status(status.unauthorised).send()
        return
      }

      // Retrieve the update type.
      const { type, username } = req.body

      if (type == "update-user") {
        const { email, enabled, groups } = req.body
        if (!validator.isValidEmail(email)) {
          console.log(`Admin update user: User ${username} has invalid email format.`)
          res.status(status.error).json({ message: "Invalid email format." })
          return
        }

        if (!validator.isValidEnabled(enabled)) {
          console.log(`Admin update user: User ${username} has invalid enabled format.`)
          res.status(status.error).json({ message: "Invalid enabled format." })
          return
        }

        // Ensure that the groups exist.
        const groupsExist = await doesGroupsExist(groups)
        if (!groupsExist) {
          console.log(`Admin update user: User ${username} has invalid groups.`)
          res.status(status.error).json({ message: "Invalid groups." })
          return
        }

        // Ensure that the super admin cannot be disabled.
        if (enabled == false && username == process.env.USER_SUPER_ADMIN) {
          console.log(`Admin update user: Super admin ${username} cannot be disabled.`)
          res.status(status.error).json({ message: "Super admin cannot be disabled." })
          return
        }

        // Update user in database.
        await db.query(`UPDATE user SET user_email=?, user_enabled=? WHERE user_username=?`, [email, enabled, username])

        // Groups to remove.
        const currentGroups = await getUserGroups(username)
        const removeGroupsSet = new Set()
        for (let i = 0; i < currentGroups.length; ++i) {
          removeGroupsSet.add(currentGroups[i])
        }

        // Groups to add.
        const addGroupsSet = new Set()
        for (let i = 0; i < groups.length; ++i) {
          const key = groups[i]
          if (removeGroupsSet.has(key)) {
            removeGroupsSet.delete(key)
          } else {
            addGroupsSet.add(key)
          }
        }

        // Ensure that the super admin cannot remove the admin group.
        if (username == process.env.USER_SUPER_ADMIN && removeGroupsSet.has(process.env.GROUP_ADMIN)) {
          console.log(`Admin update user: User ${username} is super admin and cannot remove ${process.env.GROUP_ADMIN} role.`)
          res.status(status.error).json({ message: "Super admin cannot have ${process.env.GROUP_ADMIN} group removed." })
          return
        }

        // Delete unwanted groups from database.
        for (const group of removeGroupsSet) {
          await db.query(`DELETE FROM tagging WHERE tagging_user=? AND tagging_tag=?;`, [username, group])
        }

        // Insert new groups into database.
        for (const group of addGroupsSet) {
          await db.query(`INSERT INTO tagging (tagging_user, tagging_tag) VALUES (?, ?);`, [username, group])
        }

        // Send response.
        res.status(status.ok).json({
          message: "User details updated successfully.",
          username,
          email,
          groups,
          enabled: await checkEnabled(username),
          isAdmin: groups.includes(process.env.GROUP_ADMIN), // O(n) time search, but number of groups is usually small, so who cares?
          isAppCreator: groups.includes(process.env.GROUP_APP_CREATOR),
          isPlanCreator: groups.includes(process.env.GROUP_PLAN_CREATOR),
        })

        console.log(`Admin update user: User ${username} updated successfully.`)
      } else if (type == "reset-password") {
        const { password } = req.body
        if (!validator.isValidPassword(password)) {
          console.log(`Admin update user: User ${username} has invalid password format.`)
          res.status(status.error).json({ message: "Invalid password format. Length 8 to 10. Only alphanumeric and special characters." })
          return
        }

        const statement = `UPDATE user SET user_password=? WHERE user_username=?`
        await db.query(statement, [hashPassword(password), username])

        console.log(`Admin update user: User ${username} updated password successfully.`)

        // Send response.
        res.status(status.ok).json({
          message: "User password updated successfully.",
          username,
        })
      } else {
        throw `Admin update user: User ${username} has invalid update action.`
      }
    } catch (e) {
      console.log(e)
      res.status(status.error).json({ message: "Unknown error." })
    }
  }
  doQuery(req, res)
})

module.exports = router
