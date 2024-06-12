const express = require("express")
const jwt = require("jsonwebtoken")

const status = require("./status")

// Controllers.
const admin_controller = require("./admin_controller")
const user_controller = require("./user_controller")
const app_controller = require("./app_controller")
const task_controller = require("./task_controller")
const plan_controller = require("./plan_controller")

// Express router.
const router = express.Router()

// Authentication middlware.
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

/******************** User ********************/
// User login.
router.post("/login", (req, res) => {
  user_controller.doLogin(req, res)
})

// Get hardcoded groups of a user.
router.get("/user/authenticate", authToken, (req, res) => {
  user_controller.doAuthenticate(req, res)
})

// Update user. (Non-admin)
router.patch("/user/profile", authToken, (req, res) => {
  user_controller.doUpdateUser(req, res)
})

/******************** Admin ********************/
// Get all groups.
router.get("/user/groups", authToken, (req, res) => {
  user_controller.doGetGroups(req, res)
})

// Create new group.
router.post("/user/groups", authToken, (req, res) => {
  admin_controller.doCreateGroup(req, res)
})

// Retrieve all users.
router.get("/user/users", authToken, (req, res) => {
  admin_controller.doGetAllUsers(req, res)
})

// Create new user.
router.post("/user/users", authToken, (req, res) => {
  admin_controller.doCreateUser(req, res)
})

// Update user (Admin).
router.patch("/user/users", authToken, (req, res) => {
  admin_controller.doUpdateUser(req, res)
})

/******************** Application ********************/
// Create application.
router.post("/applications", authToken, (req, res) => {
  app_controller.doCreateApplication(req, res)
})

// Retrieve all applications.
router.get("/applications", authToken, (req, res) => {
  app_controller.doGetAllApplications(req, res)
})

// Update application.
router.patch("/applications/update", authToken, (req, res) => {
  app_controller.doUpdateApplication(req, res)
})

// Retrieve an application.
router.post("/applications/get", authToken, (req, res) => {
  app_controller.doGetApplication(req, res)
})

/******************** Plan ********************/
// Retrieve all plans.
router.post("/applications/plans/get-all", authToken, (req, res) => {
  plan_controller.doGetAllPlans(req, res)
})

// Create new plan.
router.post("/applications/plans/create", authToken, (req, res) => {
  plan_controller.doCreatePlan(req, res)
})

/******************** Task ********************/
// Retrieve all tasks.
router.post("/applications/tasks/get-all", authToken, (req, res) => {
  task_controller.doGetAllTasks(req, res)
})

// Get a single task.
router.post("/applications/tasks/get", authToken, (req, res) => {
  task_controller.doGetTask(req, res)
})

// Create task.
router.post("/applications/tasks/create", authToken, (req, res) => {
  task_controller.doCreateTask(req, res)
})

// Release task.
router.post("/applications/tasks/release", authToken, (req, res) => {
  task_controller.doReleaseTask(req, res)
})

// Change task plan.
router.post("/applications/tasks/change-plan", authToken, (req, res) => {
  task_controller.doChangeTaskPlan(req, res)
})

// Acknowledge task.
router.post("/applications/tasks/acknowledge", authToken, (req, res) => {
  task_controller.doAcknowledgeTask(req, res)
})

// Complete task.
router.post("/applications/tasks/complete", authToken, (req, res) => {
  task_controller.doCompleteTask(req, res)
})

// Halt task.
router.post("/applications/tasks/halt", authToken, (req, res) => {
  task_controller.doHaltTask(req, res)
})

// Approve task.
router.post("/applications/tasks/approve", authToken, (req, res) => {
  task_controller.doApproveTask(req, res)
})

// Reject task.
router.post("/applications/tasks/reject", authToken, (req, res) => {
  task_controller.doRejectTask(req, res)
})

// Add note.
router.post("/applications/tasks/notes", authToken, (req, res) => {
  task_controller.doAddNote(req, res)
})

// Get user's application roles.
router.post("/applications/roles/get", authToken, (req, res) => {
  task_controller.doGetRoles(req, res)
})

module.exports = router
