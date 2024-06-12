import React, { useContext, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useImmer } from "use-immer"
import Axios from "axios"
import Status from "./Status"
import Page from "./Page"
import Header from "./Header"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"
import TaskList from "./TaskList"
import TaskMenu from "./TaskMenu"
import PlanMenu from "./PlanMenu"
import Modal from "react-modal"
import TaskCard from "./TaskCard"

function AppPage() {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)
  const acronym = useParams().acronym

  const [state, setState] = useImmer({
    plans: [],
    tasks: [],

    app: {
      acronym,
      description: "",
      rnumber: 1,
    },

    roles: {
      permitCreate: false,
      permitOpen: false,
      permitTodo: false,
      permitDoing: false,
      permitDone: false,
    },

    enablePlanMenu: false,
    enableTaskMenu: false,
    taskMenuId: "",
  })

  // Retrieve this app's data from the backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.post(
          `/applications/get`,
          {
            acronym,
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
          setState((draft) => {
            draft.app = response.data.app
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

  // Retrieve plans from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.post(
          `/applications/plans/get-all`,
          { acronym },
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
          setState((draft) => {
            draft.plans = response.data.plans || []
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

  // Retrieve tasks from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.post(
          `/applications/tasks/get-all`,
          { acronym },
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
          setState((draft) => {
            draft.tasks = response.data.tasks
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

  // Retrieve user's application roles from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.post(
          `/applications/roles/get`,
          { acronym },
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
          setState((draft) => {
            draft.roles = response.data.roles
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
  }, [state.plans, state.tasks])

  return (
    <Page title="Application Page">
      <Header />

      <Modal isOpen={state.enablePlanMenu}>
        <PlanMenu parentState={state} setParentState={setState} />
      </Modal>

      <Modal isOpen={state.enableTaskMenu}>
        <TaskMenu parentState={state} setParentState={setState} />
      </Modal>

      <div style={{ textAlign: "center" }}>
        <h1>
          {state.app.acronym} {state.app.rnumber}
        </h1>
        <p>{state.app.description}</p>
      </div>

      <div style={{ textAlign: "right", padding: "2rem" }}>
        {state.roles.permitCreate && (
          <button
            onClick={() => {
              setState((draft) => {
                draft.taskMenuId = ""
                draft.enableTaskMenu = true
              })
            }}
          >
            Create Task
          </button>
        )}{" "}
        {globalState.isPlanCreator && (
          <button
            onClick={() => {
              setState((draft) => {
                draft.enablePlanMenu = true
              })
            }}
          >
            Plans
          </button>
        )}
      </div>

      <div>
        <table border="1px">
          <thead style={{ textAlign: "center" }}>
            <tr>
              <td>
                <h2>Open</h2>
              </td>
              <td>
                <h2>To-Do</h2>
              </td>
              <td>
                <h2>Doing</h2>
              </td>
              <td>
                <h2>Done</h2>
              </td>
              <td>
                <h2>Closed</h2>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <TaskList taskState="open" parentState={state} setParentState={setState} />
              </td>
              <td style={{ verticalAlign: "top" }}>
                <TaskList taskState="todo" parentState={state} setParentState={setState} />
              </td>
              <td style={{ verticalAlign: "top" }}>
                <TaskList taskState="doing" parentState={state} setParentState={setState} />
              </td>
              <td style={{ verticalAlign: "top" }}>
                <TaskList taskState="done" parentState={state} setParentState={setState} />
              </td>
              <td style={{ verticalAlign: "top" }}>
                <TaskList taskState="closed" parentState={state} setParentState={setState} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Page>
  )
}

export default AppPage
