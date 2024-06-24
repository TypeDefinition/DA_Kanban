import React, { useEffect, useContext } from "react"
import { useImmer } from "use-immer"
import Axios from "axios"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function GroupList() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [state, setState] = useImmer({
    group: null, // New group to be created.
    groups: [], // Current list of groups.
  })

  // Retrieve groups from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.get("/user/groups", {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${appState.token}`,
          },
        })

        setState((draft) => {
          draft.groups = response.data.groups || []
        })
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
      const response = await Axios.post("/user/groups", { group: state.group }, { headers: { Authorization: `Bearer ${appState.token}` } })

      // Throw error if failed.
      if (response.status != 200) throw `Failed to create group ${state.group}.`

      setState((draft) => {
        draft.groups.push(state.group)
      })
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
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.group = e.target.value
                  })
                }}
                type="text"
                placeholder="New Group"
                autoComplete="off"
              />
            </td>
            <td>
              <button type="submit" onClick={onCreateGroup}>
                Create Group
              </button>
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
