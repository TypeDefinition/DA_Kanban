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

// Create new group.
async function doCreateGroup(req, res) {
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

// Retrieve all users.
async function doGetAllUsers(req, res) {
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

// Create new user.
async function doCreateUser(req, res) {
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

// Update user (Admin).
async function doUpdateUser(req, res) {
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
      await db.query(`UPDATE user SET user_email=?, user_enabled=? WHERE user_username=?;`, [email, enabled, username])

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

module.exports = { doCreateGroup, doGetAllUsers, doCreateUser, doUpdateUser }
