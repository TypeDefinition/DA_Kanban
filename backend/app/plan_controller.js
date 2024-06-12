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

// Retrieve all plans.
async function doGetAllPlans(req, res) {
  try {
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Retrieve plans: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    const { acronym } = req.body
    const statement = `SELECT * FROM plan WHERE plan_app_acronym=?;`
    const [rows] = await db.query(statement, [acronym])
    const plans = rows.map((element) => {
      return {
        acronym: element.plan_app_acronym,
        name: element.plan_mvp_name,
        startDate: new Date(element.plan_startdate).toISOString().split("T")[0],
        endDate: new Date(element.plan_enddate).toISOString().split("T")[0],
      }
    })

    console.log(`Retrieve plans: Success.`)
    res.status(status.ok).json({ message: "Fetch plans success.", plans })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
  }
}

// Create new plan.
async function doCreatePlan(req, res) {
  try {
    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Create plan: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()
      return
    }

    const hasPermission = await checkGroup(req.user.username, process.env.GROUP_PLAN_CREATOR)
    if (!hasPermission) {
      console.log(`Create plan: ${req.user.username} is not an ${process.env.GROUP_PLAN_CREATOR}.`)
      res.status(status.unauthorised).send()
      return
    }

    const { acronym, name, startDate, endDate } = req.body
    if (!validator.isValidPlanName(name)) {
      console.log(`Create plan: Plan ${name} has invalid name format.`)
      res.status(status.error).json({ message: "Invalid plan name format." })
      return
    }

    // Insert into database.
    const statement = `INSERT INTO plan (plan_app_acronym, plan_mvp_name, plan_startdate, plan_enddate) VALUES (?, ?, ?, ?);`
    await db.query(statement, [acronym, name, startDate, endDate])

    console.log(`Create plan: Plan ${name} created successfully.`)
    res.status(status.ok).json({
      message: "Plan created.",
      plan: { name, startDate, endDate },
    })
  } catch (e) {
    console.log(e)

    // At this point, most likely is error due to duplicate.
    res.status(status.error).json({ message: "Plan already exists." })
  }
}

module.exports = { doGetAllPlans, doCreatePlan }
