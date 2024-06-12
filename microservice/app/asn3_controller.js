const bcrypt = require("bcryptjs")

const db = require("./database")
const validator = require("./validator")

// Helper functions.
const controller_helper = require("./controller_helper")
const sendEmail = controller_helper.sendEmail

async function CreateTask(req, res) {
  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    const { username, password, Task_app_Acronym, Task_Name, Task_description, Task_plan } = req.body
    const acronym = Task_app_Acronym
    const name = Task_Name
    const description = Task_description
    const plan = Task_plan

    // Ensure mandatory fields exist.
    if (!username || !password || !acronym || !name) {
      console.log("CreateTask: Missing mandatory fields.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure mandatory fields are strings.
    if (typeof username !== "string" || typeof password !== "string" || typeof acronym !== "string" || typeof name !== "string") {
      console.log("CreateTask: Mandatory fields are not strings.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure optional fields are null or strings.
    if (description && typeof description !== "string") {
      console.log("CreateTask: Description is not null or string.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    if (plan && typeof plan !== "string") {
      console.log("CreateTask: Plan is not null or string.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Check name format.
    if (!validator.isValidTaskName(name)) {
      console.log("CreateTask: Invalid name.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Check description format.
    if (description && !validator.isValidTaskDesc(description)) {
      console.log("CreateTask: Invalid description.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log("CreateTask: Application does not exist.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const app = appRows[0]

    // Ensure the plan exists.
    if (plan) {
      const [planRows] = await conn.query(`SELECT * FROM plan WHERE plan_app_acronym=? AND plan_mvp_name=?;`, [acronym, plan])
      if (planRows.length !== 1) {
        console.log("CreateTask: Plan does not exist.")
        res.status(400).send()

        conn.rollback()
        db.releaseConnection(conn)
        return
      }
    }

    // Check if user exists.
    const [userRows] = await conn.query(`SELECT * FROM user WHERE user_username=?;`, [username])
    if (userRows.length !== 1) {
      console.log("CreateTask: User does not exist.")
      res.status(401).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const user = userRows[0]

    // Check if the user is enabled.
    if (!user.user_enabled) {
      console.log("CreateTask: User disabled.")
      res.status(401).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Check if password is correct.
    const isValidPassword = await bcrypt.compare(password, user.user_password)
    if (!isValidPassword) {
      console.log("CreateTask: Incorrect password.")
      res.status(401).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Check if the user has the appropriate role.
    const [groupRows] = await conn.query(`SELECT * FROM tagging WHERE tagging_user=? AND tagging_tag=?;`, [username, app.app_permit_create])
    if (1 != groupRows.length) {
      console.log("CreateTask: No access rights.")
      res.status(403).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    const state = "open"
    const creator = username
    const owner = username
    const createDate = new Date(Date.now())
    const notes = `[${createDate.toISOString()}] ${creator}: Created task.`
    const rnumber = app.app_rnumber + 1
    const id = acronym + "_" + rnumber.toString()

    // Insert task into database.
    const statement = `INSERT INTO task (task_app_acronym, task_id, task_name, task_description, task_notes, task_creator, task_createdate, task_plan, task_state, task_owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
    await conn.query(statement, [acronym, id, name, description, notes, creator, createDate.toISOString().split("T")[0], plan, state, owner])

    // Update application running number.
    await conn.query(`UPDATE app SET app_rnumber=? WHERE app_acronym=?;`, [rnumber, acronym])

    await conn.commit()

    console.log(`CreateTask: Task ${id} created.`)
    res.status(200).json({ Task_id: id })
  } catch (e) {
    console.log(e)
    res.status(500).send()
    conn.rollback()
  }

  db.releaseConnection(conn)
}

async function GetTaskbyState(req, res) {
  try {
    const { username, password, Task_state } = req.body
    const state = Task_state

    // Ensure mandatory fields exist.
    if (!username || !password || !state) {
      console.log("GetTaskbyState: Missing mandatory fields.")
      res.status(400).send()
      return
    }

    // Ensure mandatory fields are strings.
    if (typeof username !== "string" || typeof password !== "string" || typeof state !== "string") {
      console.log("GetTaskbyState: Mandatory fields are not strings.")
      res.status(400).send()
      return
    }

    // Ensure that state is correct.
    if (state !== "open" && state !== "todo" && state !== "doing" && state !== "done" && state !== "closed") {
      console.log("GetTaskbyState: Invalid state.")
      res.status(400).send()
      return
    }

    // Check if user exists.
    const [userRows] = await db.query(`SELECT * FROM user WHERE user_username=?;`, [username])
    if (userRows.length != 1) {
      console.log("GetTaskbyState: User does not exist.")
      res.status(401).send()
      return
    }
    const user = userRows[0]

    // Check if the user is enabled.
    if (!user.user_enabled) {
      console.log("GetTaskbyState: User disabled.")
      res.status(401).send()
      return
    }

    // Check if password is correct.
    const isValidPassword = await bcrypt.compare(password, user.user_password)
    if (!isValidPassword) {
      console.log("GetTaskbyState: Incorrect password.")
      res.status(401).send()
      return
    }

    // Get tasks.
    const [taskRows] = await db.query(`SELECT * FROM task WHERE task_state=?;`, [state])
    const tasks = taskRows.map((task) => {
      return {
        Task_id: task.task_id,
        Task_Name: task.task_name,
        Task_description: task.task_description,
        Task_owner: task.task_owner,
        Task_creator: task.task_creator,
        Task_plan: task.task_plan,
        Task_createDate: task.task_createdate,
      }
    })

    console.log(`GetTaskbyState: Success.`)
    res.status(200).json({ tasks })
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
}

async function PromoteTask2Done(req, res) {
  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    const { username, password, Task_id } = req.body
    const id = Task_id

    // Ensure mandatory fields exist.
    if (!username || !password || !id) {
      console.log("PromoteTask2Done: Missing mandatory fields.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure mandatory fields are strings.
    if (typeof username !== "string" || typeof password !== "string" || typeof id !== "string") {
      console.log("PromoteTask2Done: Mandatory fields are not strings.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT * FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log("PromoteTask2Done: Task does not exist.")
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]
    const acronym = task.Task_app_Acronym

    // Ensure the task is in the correct state.
    if (task.task_state !== "doing") {
      console.log('PromoteTask2Done: Task is not in "doing" state.')
      res.status(400).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Check if user exists.
    const [userRows] = await conn.query(`SELECT * FROM user WHERE user_username=?;`, [username])
    if (userRows.length != 1) {
      console.log("PromoteTask2Done: User does not exist.")
      res.status(401).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const user = userRows[0]

    // Check if the user is enabled.
    if (!user.user_enabled) {
      console.log("PromoteTask2Done: User disabled.")
      res.status(401).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Check if password is correct.
    const isValidPassword = await bcrypt.compare(password, user.user_password)
    if (!isValidPassword) {
      console.log("PromoteTask2Done: Incorrect password.")
      res.status(401).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Get the application.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    const app = appRows[0]

    // Check if the user has the appropriate role.
    const [groupRows] = await conn.query(`SELECT * FROM tagging WHERE tagging_user=? AND tagging_tag=?;`, [username, app.app_permit_doing])
    if (1 != groupRows.length) {
      console.log("PromoteTask2Done: No access rights.")
      res.status(403).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = username
    const timestamp = new Date(Date.now()).toISOString()
    const notes = `[${timestamp}] ${username}: Completed task.\n` + task.task_notes

    // Update task state in database.
    const state = "done"
    await conn.query(`UPDATE task SET task_state=?, task_notes=?, task_owner=? WHERE task_id=?;`, [state, notes, owner, id])

    // Send email notification.
    if (app.app_permit_done) {
      async function sendEmailNotification() {
        const [groupRows] = await conn.query(`SELECT tagging_user FROM tagging WHERE tagging_tag=?`, [app.app_permit_done])

        let emails = []
        for (let i = 0; i < groupRows.length; ++i) {
          const receiverUsername = groupRows[i].tagging_user
          const [emailRows] = await conn.query(`SELECT user_email FROM user WHERE user_username=? AND user_enabled=?`, [receiverUsername, true])
          if (0 < emailRows.length && emailRows[0].user_email) {
            emails.push(emailRows[0].user_email)
          }
        }

        await sendEmail(emails, `Task Complete: ${id}`, `Application ${acronym}'s task ${id} is complete and awaiting your attention.`)
      }
      sendEmailNotification()
    }

    await conn.commit()

    console.log(`PromoteTask2Done: Task ${id} completed.`)
    res.status(200).send()
  } catch (e) {
    console.log(e)
    res.status(500).send()
    conn.rollback()
  }

  db.releaseConnection(conn)
}

module.exports = { CreateTask, GetTaskbyState, PromoteTask2Done }
