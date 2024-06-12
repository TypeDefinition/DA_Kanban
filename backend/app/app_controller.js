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

// Create application.
async function doCreateApplication(req, res) {
  try {
    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Create application: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    const hasPermission = await checkGroup(req.user.username, process.env.GROUP_APP_CREATOR)
    if (!hasPermission) {
      console.log(`Create application: ${req.user.username} is not an ${process.env.GROUP_APP_CREATOR}.`)
      res.status(status.unauthorised).send()
      return
    }

    const { acronym, rnumber, description, startDate, endDate, permitCreate, permitOpen, permitToDo, permitDoing, permitDone } = req.body

    if (!validator.isValidAppAcronym(acronym)) {
      console.log(`Create application: Invalid acronym.`)
      res.status(status.error).json({ message: "Invalid app acronym. App acronym must only contain alphanumeric and underscore." })
      return
    }

    if (!validator.isValidAppRNumber(rnumber)) {
      console.log(`Create application: Invalid R-number.`)
      res.status(status.error).json({ message: "Invalid R-Number. R-Number must be a positive integer." })
      return
    }

    if (!validator.isValidAppDesc(description)) {
      console.log(`Create application: Invalid description.`)
      res.status(status.error).json({ message: "Invalid description." })
      return
    }

    if (!validator.isValidDate(startDate)) {
      console.log(`Create application: Invalid start date.`)
      res.status(status.error).json({ message: "Invalid start date." })
      return
    }

    if (!validator.isValidDate(endDate)) {
      console.log(`Create application: Invalid end date.`)
      res.status(status.error).json({ message: "Invalid end date." })
      return
    }

    // Ensure that the groups exist.
    groups = []
    if (permitCreate && "string" === typeof permitCreate) groups.push(permitCreate)
    if (permitOpen && "string" === typeof permitOpen) groups.push(permitOpen)
    if (permitToDo && "string" === typeof permitToDo) groups.push(permitToDo)
    if (permitDoing && "string" === typeof permitDoing) groups.push(permitDoing)
    if (permitDone && "string" === typeof permitDone) groups.push(permitDone)

    const groupsExist = await doesGroupsExist(groups)
    if (!groupsExist) {
      console.log(`Create application: Invalid groups.`)
      res.status(status.error).json({ message: "Invalid groups." })
      return
    }

    // Insert into database.
    await db.query(`INSERT INTO app (app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [acronym, description, rnumber, startDate, endDate, permitCreate ? permitCreate : null, permitOpen ? permitOpen : null, permitToDo ? permitToDo : null, permitDoing ? permitDoing : null, permitDone ? permitDone : null])

    console.log(`Create application: Application ${acronym} created.`)
    res.status(status.ok).json({
      message: "Application created.",
      app: { acronym, rnumber, description, startDate, endDate, permitCreate, permitOpen, permitToDo, permitDoing, permitDone },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Application acronym already exists." })
  }
}

// Retrieve all applications.
async function doGetAllApplications(req, res) {
  try {
    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Create application: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    // Retrieve user details.
    const [rows] = await db.query(`SELECT * FROM app;`)

    const apps = rows.map((app) => {
      return {
        acronym: app.app_acronym,
        description: app.app_description,
        rnumber: app.app_rnumber,
        startDate: new Date(app.app_startdate).toISOString().split("T")[0],
        endDate: new Date(app.app_enddate).toISOString().split("T")[0],
        permitCreate: app.app_permit_create,
        permitOpen: app.app_permit_open,
        permitToDo: app.app_permit_todolist,
        permitDoing: app.app_permit_doing,
        permitDone: app.app_permit_done,
      }
    })

    res.status(status.ok).json({ message: "Applications retrieved.", apps })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
  }
}

// Update application.
async function doUpdateApplication(req, res) {
  try {
    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Edit application: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    const hasPermission = await checkGroup(req.user.username, process.env.GROUP_APP_CREATOR)
    if (!hasPermission) {
      console.log(`Edit application: ${req.user.username} is not an ${process.env.GROUP_APP_CREATOR}.`)
      res.status(status.unauthorised).send()
      return
    }

    const { acronym, startDate, endDate, permitCreate, permitOpen, permitToDo, permitDoing, permitDone } = req.body

    if (!validator.isValidDate(startDate)) {
      res.status(status.error).json({ message: "Invalid start date." })
      return
    }

    if (!validator.isValidDate(endDate)) {
      res.status(status.error).json({ message: "Invalid end date." })
      return
    }

    // Ensure that the groups exist.
    groups = []
    if (permitCreate && "string" === typeof permitCreate) groups.push(permitCreate)
    if (permitOpen && "string" === typeof permitOpen) groups.push(permitOpen)
    if (permitToDo && "string" === typeof permitToDo) groups.push(permitToDo)
    if (permitDoing && "string" === typeof permitDoing) groups.push(permitDoing)
    if (permitDone && "string" === typeof permitDone) groups.push(permitDone)

    const groupsExist = await doesGroupsExist(groups)
    if (!groupsExist) {
      res.status(status.error).json({ message: "Invalid groups." })
      return
    }

    // Insert into database.
    await db.query("UPDATE app SET app_startdate=?, app_enddate=?, app_permit_create=?, app_permit_open=?, app_permit_todolist=?, app_permit_doing=?, app_permit_done=? WHERE app_acronym=?;", [startDate, endDate, permitCreate ? permitCreate : null, permitOpen ? permitOpen : null, permitToDo ? permitToDo : null, permitDoing ? permitDoing : null, permitDone ? permitDone : null, acronym])
    const [rows] = await db.query("SELECT * FROM app WHERE app_acronym=?;", [acronym])

    console.log(`Edit application: Application ${acronym} edited.`)
    res.status(status.ok).json({
      message: "Application edited.",
      app: {
        acronym,
        description: rows[0].app_description,
        rnumber: rows[0].app_rnumber,
        startDate: new Date(rows[0].app_startdate).toISOString().split("T")[0],
        endDate: new Date(rows[0].app_enddate).toISOString().split("T")[0],
        permitCreate,
        permitOpen,
        permitToDo,
        permitDoing,
        permitDone,
      },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
  }
}

// Retrieve an application.
async function doGetApplication(req, res) {
  try {
    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Create application: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    const { acronym } = req.body
    const [rows] = await db.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    const app = rows.map((app) => {
      return {
        acronym: app.app_acronym,
        description: app.app_description,
        rnumber: app.app_rnumber,
        startDate: new Date(app.app_startdate).toISOString().split("T")[0],
        endDate: new Date(app.app_enddate).toISOString().split("T")[0],
        permitCreate: app.app_permit_create,
        permitOpen: app.app_permit_open,
        permitToDo: app.app_permit_todolist,
        permitDoing: app.app_permit_doing,
        permitDone: app.app_permit_done,
      }
    })[0]

    console.log(`Retrieve application: Got application ${app.acronym} successfully.`)
    res.status(status.ok).json({ message: "Application retrieved.", app })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
  }
}

module.exports = { doCreateApplication, doGetAllApplications, doUpdateApplication, doGetApplication }
