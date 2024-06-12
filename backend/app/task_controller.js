const db = require("./database")
const validator = require("./validator")
const status = require("./status")

// Helper functions.
const controller_helper = require("./controller_helper")
const sendEmail = controller_helper.sendEmail
const hashPassword = controller_helper.hashPassword
const checkGroup = controller_helper.checkGroup
const getUserGroups = controller_helper.getUserGroups
const doesGroupsExist = controller_helper.doesGroupsExist
const checkEnabled = controller_helper.checkEnabled
const checkRole = controller_helper.checkRole

// Retrieve all tasks.
async function doGetAllTasks(req, res) {
  const username = req.user.username
  const { acronym } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(username)
  if (!isEnabled) {
    console.log(`Retrieve tasks: ${username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  try {
    // Get tasks.
    const [taskRows] = await db.query(`SELECT * FROM task WHERE task_app_acronym=?;`, [acronym])
    const tasks = taskRows.map((task) => {
      return {
        id: task.task_id,
        name: task.task_name,
        description: task.task_description,
        plan: task.task_plan,
        creator: task.task_creator,
        owner: task.task_owner,
        state: task.task_state,
      }
    })

    console.log(`Retrieve tasks: Success.`)
    res.status(status.ok).json({
      message: "Tasks retrieved.",
      tasks,
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
  }
}

// Get a single task.
async function doGetTask(req, res) {
  const username = req.user.username

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(username)
  if (!isEnabled) {
    console.log(`Retrieve task: ${username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  try {
    const { id } = req.body
    const [taskRows] = await db.query(`SELECT * FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Retrieve task: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })
      return
    }

    const task = {
      state: taskRows[0].task_state,
      creator: taskRows[0].task_creator,
      createDate: taskRows[0].task_createdate,
      id: taskRows[0].task_id,
      owner: taskRows[0].task_owner,
      name: taskRows[0].task_name,
      description: taskRows[0].task_description,
      plan: taskRows[0].task_plan,
      notes: taskRows[0].task_notes,
    }

    console.log(`Retrieve task: Task ${id} retrieved.`)
    res.status(status.ok).json({
      message: "Task retrieved.",
      task,
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Task does not exist." })
  }
}

// Create task.
async function doCreateTask(req, res) {
  const username = req.user.username
  const { acronym, name, description, plan } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(username)
  if (!isEnabled) {
    console.log(`Create task: ${username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, username, "create")
  if (!hasRole) {
    console.log(`Create task: ${username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Create task: application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const app = appRows[0]

    // Check name format.
    if (!validator.isValidTaskName(name)) {
      console.log(`Create task: Task ${name} has invalid name format.`)
      res.status(status.error).json({ message: "Invalid plan name format." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Check description format.
    if (!validator.isValidTaskDesc(description)) {
      console.log(`Create task: Task ${name} has invalid description format.`)
      res.status(status.error).json({ message: "Invalid task description format." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure plan exists.
    if (plan) {
      const [planRows] = await conn.query(`SELECT * FROM plan WHERE plan_app_acronym=? AND plan_mvp_name=?;`, [acronym, plan])
      if (planRows.length !== 1) {
        console.log(`Create task: Plan ${plan} is not found.`)
        res.status(status.error).json({ message: "Plan not found." })

        conn.rollback()
        db.releaseConnection(conn)
        return
      }
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
    await conn.query(statement, [acronym, id, name, description, notes, creator, createDate.toISOString().split("T")[0], plan ? plan : null, state, owner])

    // Update application running number.
    await conn.query(`UPDATE app SET app_rnumber=? WHERE app_acronym=?;`, [rnumber, acronym])

    await conn.commit()

    console.log(`Create task: Task ${id} created.`)
    res.status(status.ok).json({
      message: "Task created.",
      task: { id, name, description, plan, creator, owner, state, notes },
      app: { rnumber },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Release task.
async function doReleaseTask(req, res) {
  const username = req.user.username
  const { acronym, id } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(username)
  if (!isEnabled) {
    console.log(`Release task: ${username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, username, "open")
  if (!hasRole) {
    console.log(`Release task: ${username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Release task: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT task_state, task_notes FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Release task: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure the task is in the correct state.
    if (task.task_state !== "open") {
      console.log(`Release task: Task ${id} is not in the open state.`)
      res.status(status.error).json({ message: "Task not in open state." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = username
    const timestamp = new Date(Date.now()).toISOString()
    const notes = `[${timestamp}] ${username}: Released task.\n` + task.task_notes

    // Update task state in database.
    const state = "todo"
    await conn.query(`UPDATE task SET task_state=?, task_notes=?, task_owner=? WHERE task_id=?;`, [state, notes, owner, id])

    await conn.commit()

    console.log(`Release task: Task ${id} released.`)
    res.status(status.ok).json({
      message: "Task released.",
      task: { id, owner, state, notes },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Change task plan.
async function doChangeTaskPlan(req, res) {
  const { acronym, id, plan } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(req.user.username)
  if (!isEnabled) {
    console.log(`Change task plan: ${req.user.username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, req.user.username, "open")
  if (!hasRole) {
    console.log(`Change task plan: ${req.user.username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Change task plan: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the plan exists.
    if (plan) {
      const [rows] = await conn.query(`SELECT * FROM plan WHERE plan_app_acronym=? AND plan_mvp_name=?;`, [acronym, plan])
      if (rows.length !== 1) {
        console.log(`Change task plan: Plan ${plan} is not found.`)
        res.status(status.error).json({ message: "Plan not found." })

        conn.rollback()
        db.releaseConnection(conn)
        return
      }
    }

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT task_state, task_notes, task_plan FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Change task plan: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure the task is in the correct state.
    if (task.task_state !== "open") {
      console.log(`Change task plan: Task ${id} is not in the open state.`)
      res.status(status.error).json({ message: "Task not in open state." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure that the new plan is different from the current plan.
    if (task.task_plan === plan) {
      console.log(`Change task plan: New plan is same as current plan.`)
      res.status(status.error).json({ message: "Task already has this plan." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = req.user.username
    const timestamp = new Date(Date.now()).toISOString()
    let notes = ""
    if (plan) {
      notes = `[${timestamp}] ${req.user.username}: Changed plan to ${plan}.\n` + task.task_notes
    } else {
      notes = `[${timestamp}] ${req.user.username}: Removed plan.\n` + task.task_notes
    }

    // Update task plan in database.
    await conn.query(`UPDATE task SET task_plan=?, task_notes=?, task_owner=? WHERE task_id=?;`, [plan, notes, owner, id])

    await conn.commit()

    console.log(`Change task plan: Task ${id} changed plan.`)
    res.status(status.ok).json({
      message: "Task changed plan.",
      task: { id, owner, plan, notes },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Acknowledge task.
async function doAcknowledgeTask(req, res) {
  const { acronym, id } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(req.user.username)
  if (!isEnabled) {
    console.log(`Acknowledge task: ${req.user.username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, req.user.username, "todo")
  if (!hasRole) {
    console.log(`Acknowledge task: ${req.user.username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Acknowledge task: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT task_state, task_notes FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Acknowledge task: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure the task is in the correct state.
    if (task.task_state !== "todo") {
      console.log(`Acknowledge task: Task ${id} is not in the open state.`)
      res.status(status.error).json({ message: "Task not in open state." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = req.user.username
    const timestamp = new Date(Date.now()).toISOString()
    const notes = `[${timestamp}] ${req.user.username}: Acknowledged task.\n` + task.task_notes

    // Update task state in database.
    const state = "doing"
    await conn.query(`UPDATE task SET task_state=?, task_notes=?, task_owner=? WHERE task_id=?;`, [state, notes, owner, id])

    await conn.commit()

    console.log(`Acknowledge task: T ask ${id} acknowledged.`)
    res.status(status.ok).json({
      message: "Task acknowledged.",
      task: { id, owner, state, notes },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Complete task.
async function doCompleteTask(req, res) {
  const { acronym, id } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(req.user.username)
  if (!isEnabled) {
    console.log(`Complete task: ${req.user.username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, req.user.username, "doing")
  if (!hasRole) {
    console.log(`Complete task: ${req.user.username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Complete task: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const app = appRows[0]
    const permitDoneGroup = app.app_permit_done

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT task_state, task_notes FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Complete task: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure the task is in the correct state.
    if (task.task_state !== "doing") {
      console.log(`Complete task: Task ${id} is not in the open state.`)
      res.status(status.error).json({ message: "Task not in open state." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = req.user.username
    const timestamp = new Date(Date.now()).toISOString()
    const notes = `[${timestamp}] ${req.user.username}: Completed task.\n` + task.task_notes

    // Update task state in database.
    const state = "done"
    await conn.query(`UPDATE task SET task_state=?, task_notes=?, task_owner=? WHERE task_id=?;`, [state, notes, owner, id])

    // Send email notification.
    if (permitDoneGroup) {
      async function sendEmailNotification() {
        const [groupRows] = await conn.query(`SELECT tagging_user FROM tagging WHERE tagging_tag=?`, [permitDoneGroup])

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

    console.log(`Complete task: Task ${id} completed.`)
    res.status(status.ok).json({
      message: "Task completed.",
      task: { id, owner, state, notes },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Halt task.
async function doHaltTask(req, res) {
  const { acronym, id } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(req.user.username)
  if (!isEnabled) {
    console.log(`Halt task: ${req.user.username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, req.user.username, "doing")
  if (!hasRole) {
    console.log(`Halt task: ${req.user.username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    let [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Halt task: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT task_state, task_notes FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Halt task: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure the task is in the correct state.
    if (task.task_state !== "doing") {
      console.log(`Halt task: Task ${id} is not in the open state.`)
      res.status(status.error).json({ message: "Task not in open state." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = req.user.username
    const timestamp = new Date(Date.now()).toISOString()
    const notes = `[${timestamp}] ${req.user.username}: Halted task.\n` + task.task_notes

    // Update task state in database.
    const state = "todo"
    await conn.query(`UPDATE task SET task_state=?, task_notes=?, task_owner=? WHERE task_id=?;`, [state, notes, owner, id])

    await conn.commit()

    console.log(`Complete task: Task ${id} halted.`)
    res.status(status.ok).json({
      message: "Task halted.",
      task: { id, owner, state, notes },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Approve task.
async function doApproveTask(req, res) {
  const { acronym, id } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(req.user.username)
  if (!isEnabled) {
    console.log(`Approve task: ${req.user.username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, req.user.username, "done")
  if (!hasRole) {
    console.log(`Approve task: ${req.user.username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Approve task: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT task_state, task_notes FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Approve task: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure the task is in the correct state.
    if (task.task_state !== "done") {
      console.log(`Approve task: Task ${id} is not in the open state.`)
      res.status(status.error).json({ message: "Task not in open state." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = req.user.username
    const timestamp = new Date(Date.now()).toISOString()
    const notes = `[${timestamp}] ${req.user.username}: Approved task.\n` + task.task_notes

    // Update task state in database.
    const state = "closed"
    await conn.query(`UPDATE task SET task_state=?, task_notes=?, task_owner=? WHERE task_id=?;`, [state, notes, owner, id])

    await conn.commit()

    console.log(`Complete task: Task ${id} approved.`)
    res.status(status.ok).json({
      message: "Task approved.",
      task: { id, owner, state, notes },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Reject task.
async function doRejectTask(req, res) {
  const { acronym, id, plan } = req.body
  const username = req.user.username

  const isEnabled = await checkEnabled(username)
  if (!isEnabled) {
    console.log(`Retrieve tasks: ${username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const hasRole = await checkRole(acronym, username, "done")
  if (!hasRole) {
    console.log(`Approve task: ${username} does not have correct role.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure the application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Reject task: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Ensure the plan exists.
    if (plan) {
      const [planRows] = await conn.query(`SELECT * FROM plan WHERE plan_app_acronym=? AND plan_mvp_name=?;`, [acronym, plan])
      if (planRows.length !== 1) {
        console.log(`Reject task: Plan ${plan} is not found.`)
        res.status(status.error).json({ message: "Plan not found." })

        conn.rollback()
        db.releaseConnection(conn)
        return
      }
    }

    // Ensure the task exists.
    const [taskRows] = await conn.query(`SELECT task_state, task_notes, task_plan FROM task WHERE task_id=?;`, [id])
    if (taskRows.length !== 1) {
      console.log(`Reject task: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure the task is in the correct state.
    if (task.task_state !== "done") {
      console.log(`Reject task: Task ${id} is not in the open state.`)
      res.status(status.error).json({ message: "Task not in open state." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    // Add log in notes.
    const owner = req.user.username
    const timestamp = new Date(Date.now()).toISOString()
    let notes = `[${timestamp}] ${req.user.username}: Rejected task.\n` + task.task_notes
    if (plan !== task.task_plan) {
      if (plan) {
        notes = `[${timestamp}] ${req.user.username}: Changed plan to ${plan}.\n` + notes
      } else {
        notes = `[${timestamp}] ${req.user.username}: Removed plan.\n` + notes
      }
    }

    // Update task state in database.
    const state = "doing"
    await conn.query(`UPDATE task SET task_state=?, task_notes=?, task_plan=?, task_owner=? WHERE task_id=?;`, [state, notes, plan, owner, id])

    await conn.commit()

    console.log(`Reject task: Task ${id} rejected.`)
    res.status(status.ok).json({
      message: "Task approved.",
      task: { id, owner, state, notes, plan },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Add note.
async function doAddNote(req, res) {
  const { acronym, id, note } = req.body

  // Ensure that the current user has sufficient permissions.
  const isEnabled = await checkEnabled(req.user.username)
  if (!isEnabled) {
    console.log(`Add notes: ${req.user.username} is not enabled.`)
    res.status(status.unauthorised).send()
    return
  }

  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    // Ensure application exists.
    const [appRows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (appRows.length !== 1) {
      console.log(`Add notes: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const app = appRows[0]

    // Get existing notes to append to.
    if (!validator.isValidNote(note)) {
      console.log(`Add notes: Invalid note format.`)
      res.status(status.error).json({ message: "Invalid note format." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    const [taskRows] = await conn.query("SELECT task_notes, task_state from task WHERE task_id=?", [id])
    if (taskRows.length !== 1) {
      console.log(`Add notes: Task ${id} is not found.`)
      res.status(status.error).json({ message: "Task not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }
    const task = taskRows[0]

    // Ensure that the user has the correct role to add note at this time.
    let permitGroup = ""
    switch (task.task_state) {
      case "open":
        permitGroup = app.app_permit_open
        break
      case "todo":
        permitGroup = app.app_permit_todolist
        break
      case "doing":
        permitGroup = app.app_permit_doing
        break
      case "done":
        permitGroup = app.app_permit_done
        break
      case "closed":
        console.log(`Add notes: Task ${id} is already closed.`)
        res.status(status.error).json({ message: "Task already closed." })

        conn.rollback()
        db.releaseConnection(conn)
        return
    }

    const [groupRows] = await db.query(`SELECT * FROM tagging WHERE tagging_user=? AND tagging_tag=?;`, [req.user.username, permitGroup])
    if (groupRows.length != 1) {
      console.log(`Add notes: ${req.user.username} does not have correct role.`)
      res.status(status.unauthorised).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    const owner = req.user.username
    const timestamp = new Date(Date.now()).toISOString()
    const notes = `[${timestamp}] ${req.user.username}: ${note}\n` + task.task_notes

    // Update notes in database.
    await conn.query(`UPDATE task SET task_owner=?, task_notes=? WHERE task_id=?;`, [owner, notes, id])

    await conn.commit()

    console.log(`Add notes: Note added to task ${id}.`)
    res.status(status.ok).json({
      message: "Task created.",
      task: { id, notes, owner },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

// Get user's application roles.
async function doGetRoles(req, res) {
  const conn = await db.getConnection()

  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await conn.beginTransaction()

    const { acronym } = req.body
    const username = req.user.username

    // Ensure that the current user has sufficient permissions.
    const isEnabled = await checkEnabled(req.user.username)
    if (!isEnabled) {
      console.log(`Get application roles: ${req.user.username} is not enabled.`)
      res.status(status.unauthorised).send()

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    let [rows] = await conn.query(`SELECT * FROM app WHERE app_acronym=?;`, [acronym])
    if (rows.length !== 1) {
      console.log(`Get application roles: Application ${acronym} is not found.`)
      res.status(status.error).json({ message: "Application not found." })

      conn.rollback()
      db.releaseConnection(conn)
      return
    }

    await conn.commit()

    // Do not use the checkRole function. No point doing 5 queries when 1 will do.
    console.log(`Get application roles: User ${username} got roles.`)
    res.status(status.ok).json({
      message: "Got application roles.",
      roles: {
        permitCreate: await checkGroup(username, rows[0].app_permit_create),
        permitOpen: await checkGroup(username, rows[0].app_permit_open),
        permitTodo: await checkGroup(username, rows[0].app_permit_todolist),
        permitDoing: await checkGroup(username, rows[0].app_permit_doing),
        permitDone: await checkGroup(username, rows[0].app_permit_done),
      },
    })
  } catch (e) {
    console.log(e)
    res.status(status.error).json({ message: "Unknown error." })
    conn.rollback()
  }

  db.releaseConnection(conn)
}

module.exports = {
  doGetAllTasks,
  doGetTask,
  doCreateTask,
  doReleaseTask,
  doChangeTaskPlan,
  doAcknowledgeTask,
  doCompleteTask,
  doHaltTask,
  doApproveTask,
  doRejectTask,
  doAddNote,
  doGetRoles,
}
