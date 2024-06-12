import React, { useContext, useEffect } from "react"
import { useImmer } from "use-immer"
import Select from "react-select"
import Axios from "axios"
import Status from "./Status"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./AppMenu.css"

function AppMenu({ parentState, setParentState }) {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)
  const isEditMode = parentState.menu.type == "edit"
  const menuTitle = isEditMode ? "Edit App" : "Create App"
  const onSubmit = isEditMode ? onUpdateApp : onCreateApp

  const [state, setState] = useImmer({
    groups: [],

    app: {
      acronym: "",
      rnumber: 1,
      description: "",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      permitCreate: "",
      permitOpen: "",
      permitToDo: "",
      permitDoing: "",
      permitDone: "",
    },

    status: "",
    statusColor: "black",
  })

  // Retrieve groups from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.get("/user/groups", {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${globalState.token}`,
          },
        })

        // Unauthorised access.
        if (response.status == Status.unauthorised) {
          globalDispatch({ type: "logout" })
        }

        // Success.
        if (response.status == Status.ok) {
          setState((draft) => {
            draft.groups = response.data.groups || []
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

  // Retrieve app from backend. (Edit only.)
  useEffect(() => {
    if (!isEditMode) return
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.post(
          `/applications/get`,
          { acronym: `${parentState.menu.acronym}` },
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

  async function onCreateApp(event) {
    event.preventDefault()
    try {
      const response = await Axios.post("/applications", state.app, { headers: { Authorization: `Bearer ${globalState.token}` } })

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColor = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColor = "green"
        })

        // Append to app list.
        setParentState((draft) => {
          draft.apps.push(response.data.app)
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function onUpdateApp(event) {
    event.preventDefault()
    try {
      const response = await Axios.patch(`/applications/update`, state.app, { headers: { Authorization: `Bearer ${globalState.token}` } })

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColor = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColor = "green"
        })

        setParentState((draft) => {
          for (let i = 0; i < draft.apps.length; ++i) {
            if (draft.apps[i].acronym == parentState.menu.acronym) {
              draft.apps[i] = response.data.app
              break
            }
          }
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className="app-menu">
      <div style={{ float: "right", padding: "1rem" }}>
        <button
          onClick={() => {
            setParentState((draft) => {
              draft.menu.enable = false
            })
          }}
        >
          X
        </button>
      </div>

      <h1>{menuTitle}</h1>
      <form onSubmit={onSubmit}>
        <div>
          <table>
            <tbody>
              <tr>
                <td>Acronym: </td>
                <td>
                  <input
                    disabled={isEditMode}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.acronym = e.target.value
                      })
                    }}
                    value={state.app.acronym}
                    type="text"
                    placeholder="Enter application acronym."
                    autoComplete="off"
                  />
                </td>
              </tr>

              <tr>
                <td>R-Number: </td>
                <td>
                  <input
                    disabled={isEditMode}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.rnumber = parseInt(e.target.value)
                      })
                    }}
                    value={state.app.rnumber}
                    type="number"
                    min="1"
                    placeholder="Enter a positive integer."
                    autoComplete="off"
                  />
                </td>
              </tr>

              <tr>
                <td>Description:</td>
                <td>
                  <textarea
                    disabled={isEditMode}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.description = e.target.value
                      })
                    }}
                    style={{ width: "32rem", height: "4rem", resize: "vertical" }}
                    value={state.app.description}
                    type="text"
                    placeholder="Enter application description."
                    autoComplete="off"
                  />
                </td>
              </tr>

              <tr>
                <td>Start Date: </td>
                <td>
                  <input
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.startDate = new Date(e.target.value).toISOString().split("T")[0]
                      })
                    }}
                    value={state.app.startDate}
                    type="date"
                    autoComplete="off"
                  />
                </td>
              </tr>

              <tr>
                <td>End Date:</td>
                <td>
                  <input
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.endDate = new Date(e.target.value).toISOString().split("T")[0]
                      })
                    }}
                    value={state.app.endDate}
                    type="date"
                    autoComplete="off"
                  />
                </td>
              </tr>

              <tr>
                <td>Permit Create: </td>
                <td>
                  <Select
                    options={[{ value: "", label: "Select a group..." }].concat(
                      state.groups.map((group) => {
                        return { value: group, label: group }
                      })
                    )}
                    value={{ value: state.app.permitCreate, label: state.app.permitCreate }}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.permitCreate = e.value
                      })
                    }}
                  />
                </td>
              </tr>

              <tr>
                <td>Permit Open: </td>
                <td>
                  <Select
                    options={[{ value: "", label: "Select a group..." }].concat(
                      state.groups.map((group) => {
                        return { value: group, label: group }
                      })
                    )}
                    value={{ value: state.app.permitOpen, label: state.app.permitOpen }}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.permitOpen = e.value
                      })
                    }}
                  />
                </td>
              </tr>

              <tr>
                <td>Permit To-Do: </td>
                <td>
                  <Select
                    options={[{ value: "", label: "Select a group..." }].concat(
                      state.groups.map((group) => {
                        return { value: group, label: group }
                      })
                    )}
                    value={{ value: state.app.permitToDo, label: state.app.permitToDo }}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.permitToDo = e.value
                      })
                    }}
                  />
                </td>
              </tr>

              <tr>
                <td>Permit Doing: </td>
                <td>
                  <Select
                    options={[{ value: "", label: "Select a group..." }].concat(
                      state.groups.map((group) => {
                        return { value: group, label: group }
                      })
                    )}
                    value={{ value: state.app.permitDoing, label: state.app.permitDoing }}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.permitDoing = e.value
                      })
                    }}
                  />
                </td>
              </tr>

              <tr>
                <td>Permit Done: </td>
                <td>
                  <Select
                    options={[{ value: "", label: "Select a group..." }].concat(
                      state.groups.map((group) => {
                        return { value: group, label: group }
                      })
                    )}
                    value={{ value: state.app.permitDone, label: state.app.permitDone }}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.app.permitDone = e.value
                      })
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <button type="submit" style={{ float: "right" }}>
            Submit
          </button>
          <p>
            <font color={state.statusColor}>{state.status}</font>
          </p>
        </div>
      </form>
    </div>
  )
}

export default AppMenu
