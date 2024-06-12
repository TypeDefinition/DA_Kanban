import React, { useContext, useEffect } from "react"
import Axios from "axios"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"
import Status from "./Status"

function GroupList({ state, setState }) {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)

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
          // Populate group list.
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

  async function onCreateGroup() {
    try {
      const response = await Axios.post("/user/groups", { group: state.newGroup }, { headers: { Authorization: `Bearer ${globalState.token}` } })

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.newGroupStatus = response.data.message
          draft.newGroupStatusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        // Append to group list.
        setState((draft) => {
          draft.newGroupStatus = response.data.message
          draft.newGroupStatusColour = "green"
          draft.groups.push(state.newGroup)
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div>
      <h2>Groups</h2>
      <h3>Create Group</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Group Name</th>
            <th>Create Group</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.newGroup = e.target.value
                  })
                }}
                type="text"
                placeholder="Group Name"
                autoComplete="off"
              />
            </td>
            <td>
              <button type="submit" onClick={onCreateGroup}>
                Create Group
              </button>
            </td>
            <td>
              <font color={state.newGroupStatusColour}>{state.newGroupStatus}</font>
            </td>
          </tr>
        </tbody>
      </table>
      <h3>Group List</h3>
      <table border="1">
        <thead>
          <tr align="center">
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {state.groups.map((group) => (
            <tr align="center" key={group}>
              <td>{group}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GroupList
