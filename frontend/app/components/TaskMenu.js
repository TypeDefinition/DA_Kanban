import React, { act, useContext, useEffect } from "react"
import { useImmer } from "use-immer"
import Select from "react-select"
import Axios from "axios"
import Status from "./Status"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./TaskMenu.css"

function TaskMenu({ parentState, setParentState }) {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)

  const [state, setState] = useImmer({
    // Does this user have permission to edit anything at all?
    hasEditPermit: false,

    // UI Stuff
    title: "Create Task",
    canEditName: true,
    canEditDesc: true,
    canEditPlan: true,
    canEditNotes: false,

    enableAction1: true,
    actionLabel1: "Create",

    enableAction2: false,
    actionLabel2: "",

    // Task Data (Default to create state.)
    state: "create",

    creator: "-",
    createDate: "-",

    id: parentState.taskMenuId,
    owner: "-",
    name: "",
    description: "",
    plan: "", // Just the plan name, not the whole plan object.
    serverPlan: "", // Used to prevent closing a task while the plan changed.

    notes: "", // Current Notes
    newNote: "", // New Note

    status: "",
    statusColour: "black",
  })

  // Get task data from backend.
  useEffect(() => {
    // If there is no ID, we are creating a new task.
    if (!state.id) {
      setState((draft) => {
        draft.hasEditPermit = parentState.roles.permitCreate
      })
      return
    }

    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.post(
          `/applications/tasks/get`,
          {
            id: `${state.id}`,
          },
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${globalState.token}`,
            },
          }
        )

        // Unauthorised access.
        if (response.status == Status.unauthorised) {
          globalDispatch({ type: "logout" })
        }

        // Success.
        if (response.status == Status.ok) {
          // Get task state.
          setState((draft) => {
            draft.state = response.data.task.state

            draft.creator = response.data.task.creator
            draft.createDate = response.data.task.createDate

            draft.id = response.data.task.id
            draft.owner = response.data.task.owner
            draft.name = response.data.task.name
            draft.description = response.data.task.description
            draft.plan = response.data.task.plan
            draft.serverPlan = response.data.task.plan

            draft.notes = response.data.task.notes

            // Update UI
            switch (draft.state) {
              case "open":
                draft.title = "Open Task"
                draft.canEditName = false
                draft.canEditDesc = false
                draft.canEditPlan = true
                draft.canEditNotes = true

                draft.enableAction1 = true
                draft.actionLabel1 = "Release"

                draft.enableAction2 = true
                draft.actionLabel2 = "Change Plan"

                draft.hasEditPermit = parentState.roles.permitOpen
                break
              case "todo":
                draft.title = "To-Do Task"
                draft.canEditName = false
                draft.canEditDesc = false
                draft.canEditPlan = false
                draft.canEditNotes = true

                draft.enableAction1 = true
                draft.actionLabel1 = "Acknowledge"

                draft.enableAction2 = false
                draft.actionLabel2 = ""

                draft.hasEditPermit = parentState.roles.permitTodo
                break
              case "doing":
                draft.title = "Doing Task"
                draft.canEditName = false
                draft.canEditDesc = false
                draft.canEditPlan = false
                draft.canEditNotes = true

                draft.enableAction1 = true
                draft.actionLabel1 = "Send For Review"

                draft.enableAction2 = true
                draft.actionLabel2 = "Halt"

                draft.hasEditPermit = parentState.roles.permitDoing
                break
              case "done":
                draft.title = "Done Task"
                draft.canEditName = false
                draft.canEditDesc = false
                draft.canEditPlan = true
                draft.canEditNotes = true

                draft.enableAction1 = true
                draft.actionLabel1 = "Approve"

                draft.enableAction2 = true
                draft.actionLabel2 = "Reject"

                draft.hasEditPermit = parentState.roles.permitDone
                break
              case "closed":
                draft.title = "Closed Task"
                draft.canEditName = false
                draft.canEditDesc = false
                draft.canEditPlan = false
                draft.canEditNotes = false

                draft.enableAction1 = false
                draft.actionLabel1 = ""

                draft.enableAction2 = false
                draft.actionLabel2 = ""

                draft.hasEditPermit = false
                break
            }
          })
        }
      } catch (e) {
        console.log(e)
      }
    }
    fetchData()
    return () => {
      controller.abort()
    }
  }, [])

  // Create task.
  async function onCreate() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/create`,
        {
          acronym: `${parentState.app.acronym}`,
          name: state.name,
          description: state.description,
          plan: state.plan,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setParentState((draft) => {
          draft.tasks.push(response.data.task)
          draft.app.rnumber = response.data.app.rnumber
          draft.enableTaskMenu = false // Close window.
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Open -> ToDo
  async function onRelease() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/release`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setParentState((draft) => {
          const task = draft.tasks.find((t) => t.id == response.data.task.id)
          task.state = response.data.task.state
          task.owner = response.data.task.owner
          draft.enableTaskMenu = false // Close window.
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Open -> Open
  async function onChangePlan() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/change-plan`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
          plan: state.plan,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        // Update window.
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "green"

          draft.owner = response.data.task.owner
          draft.notes = response.data.task.notes
          draft.plan = response.data.task.plan
          draft.serverPlan = response.data.task.plan
        })

        // Update parent tasks.
        setParentState((draft) => {
          const task = draft.tasks.find((t) => t.id == response.data.task.id)
          task.plan = response.data.task.plan
          task.owner = response.data.task.owner
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // ToDo -> Doing
  async function onAcknowledge() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/acknowledge`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setParentState((draft) => {
          const task = draft.tasks.find((t) => t.id == response.data.task.id)
          task.state = response.data.task.state
          task.owner = response.data.task.owner
          draft.enableTaskMenu = false // Close window.
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Doing -> Done
  async function onComplete() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/complete`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setParentState((draft) => {
          const task = draft.tasks.find((t) => t.id == response.data.task.id)
          task.state = response.data.task.state
          task.owner = response.data.task.owner
          draft.enableTaskMenu = false // Close window.
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Doing -> ToDo
  async function onHalt() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/halt`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setParentState((draft) => {
          const task = draft.tasks.find((t) => t.id == response.data.task.id)
          task.state = response.data.task.state
          task.owner = response.data.task.owner
          draft.enableTaskMenu = false // Close window.
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Done -> Close
  async function onApprove() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/approve`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setParentState((draft) => {
          const task = draft.tasks.find((t) => t.id == response.data.task.id)
          task.state = response.data.task.state
          task.owner = response.data.task.owner
          draft.enableTaskMenu = false // Close window.
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Done -> Doing
  async function onReject() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/tasks/reject`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
          plan: state.plan,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setParentState((draft) => {
          const task = draft.tasks.find((t) => t.id == response.data.task.id)
          task.state = response.data.task.state
          task.owner = response.data.task.owner
          task.plan = response.data.task.plan
          draft.enableTaskMenu = false // Close window.
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // I can't just store a function pointer in state, because that function will not update whenever state changes.
  async function onAction1() {
    switch (state.state) {
      case "create":
        onCreate()
        break
      case "open":
        onRelease()
        break
      case "todo":
        onAcknowledge()
        break
      case "doing":
        onComplete()
        break
      case "done":
        onApprove()
        break
      default:
        break
    }
  }

  async function onAction2() {
    switch (state.state) {
      case "open":
        onChangePlan()
        break
      case "doing":
        onHalt()
        break
      case "done":
        onReject()
        break
      default:
        break
    }
  }

  // Add Notes
  async function onAddNote() {
    try {
      const response = await Axios.post(
        `/applications/tasks/notes`,
        {
          acronym: `${parentState.app.acronym}`,
          id: state.id,
          note: state.newNote,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        // Do nothing.
      }

      // Success.
      if (response.status == Status.ok) {
        setState((draft) => {
          draft.notes = response.data.task.notes
          draft.newNote = ""
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className="task-menu">
      <div style={{ float: "right", padding: "1rem" }}>
        <button
          onClick={() => {
            setParentState((draft) => {
              draft.enableTaskMenu = false
            })
          }}
        >
          X
        </button>
      </div>

      <div style={{ textAlign: "center" }}>
        <h1>{state.title}</h1>
        <h3>
          Create by {state.creator} on {state.createDate}
        </h3>
      </div>

      <table border="1px">
        <tbody valign="top">
          <tr>
            <td>
              <table>
                <tbody valign="top">
                  <tr>
                    <td>ID: </td>
                    <td>{state.id}</td>
                  </tr>
                  <tr>
                    <td>Owner: </td>
                    <td>{state.owner}</td>
                  </tr>

                  <tr>
                    <td>Name: </td>
                    <td>
                      <input
                        disabled={!state.canEditName || !state.hasEditPermit}
                        value={state.name}
                        onChange={(e) => {
                          setState((draft) => {
                            draft.name = e.target.value
                          })
                        }}
                        type="text"
                        autoComplete="off"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Description: </td>
                    <td>
                      <textarea
                        disabled={!state.canEditDesc || !state.hasEditPermit}
                        style={{ width: "24rem", height: "8rem", resize: "vertical" }}
                        value={state.description}
                        onChange={(e) => {
                          setState((draft) => {
                            draft.description = e.target.value
                          })
                        }}
                        type="text"
                        autoComplete="off"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td>Plan: </td>
                    <td>
                      <Select
                        isDisabled={!state.canEditPlan || !state.hasEditPermit}
                        options={[{ value: "", label: "Select a plan..." }].concat(
                          parentState.plans.map((plan) => {
                            return { value: plan.name, label: plan.name }
                          })
                        )}
                        value={{ value: state.plan, label: state.plan }}
                        onChange={(e) => {
                          setState((draft) => {
                            draft.plan = e.value
                          })
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div>
                {state.enableAction1 && (
                  <button onClick={onAction1} type="submit" disabled={(state.state === "done" && state.serverPlan !== state.plan) || !state.hasEditPermit}>
                    {state.actionLabel1}
                  </button>
                )}{" "}
                {state.actionLabel2 && (
                  <button onClick={onAction2} type="submit" disabled={!state.hasEditPermit}>
                    {state.actionLabel2}
                  </button>
                )}
              </div>
              <div>
                <p>
                  <font color={state.statusColour}>{state.status}</font>
                </p>
              </div>
            </td>
            <td>
              <table>
                <tbody valign="top">
                  <tr>
                    <td>
                      <div style={{ width: "48rem", height: "8rem", overflowY: "auto" }}>
                        <pre>{state.notes}</pre>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <textarea
                        disabled={!state.canEditNotes || !state.hasEditPermit}
                        style={{ width: "48rem", height: "4rem", resize: "vertical" }}
                        value={state.newNote}
                        onChange={(e) => {
                          setState((draft) => {
                            draft.newNote = e.target.value
                          })
                        }}
                      ></textarea>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button disabled={!state.canEditNotes || !state.hasEditPermit} onClick={onAddNote}>
                          Add Note
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default TaskMenu
