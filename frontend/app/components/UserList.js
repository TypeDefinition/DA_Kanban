import React, { useContext, useState, useEffect } from "react"
import Select from "react-select"
import { useImmer } from "use-immer"
import Axios from "axios"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function UserList() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // Create user.
  const [state, setState] = useImmer({
    username: null, // New user to be created.
    password: null,
    email: null,
    enabled: true,
    users: [], // Current list of users.
  })

  // Retrieve users from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.get("/user/users", {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${appState.token}`,
          },
        })

        setState((draft) => {
          draft.users =
            response.data.users.map((element) => {
              return {
                username: element.username,
                password: null,
                email: element.email,
                enabled: Boolean(element.enabled),
              }
            }) || []
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

  async function onCreateUser() {
    try {
      const user = {
        username: state.username,
        password: state.password,
        email: state.email,
        enabled: state.enabled,
      }

      const response = await Axios.post("/user/users", user, { headers: { Authorization: `Bearer ${appState.token}` } })

      // Throw error if failed.
      if (response.status != 200) throw `Failed to create user ${state.username}.`

      setState((draft) => {
        draft.users.push(user)
      })
    } catch (e) {
      console.log(e)
    }
  }

  async function onUpdateUser(index) {
    try {
      const user = {
        type: "update-user",
        username: state.users[index].username,
        email: state.users[index].email,
        enabled: state.users[index].enabled,
      }

      console.log(index)
      console.log(user.enabled)

      const response = await Axios.patch("/user/users", user, { headers: { Authorization: `Bearer ${appState.token}` } })

      // Throw error if failed.
      if (response.status != 200) throw `Failed to update user ${state.username}.`
    } catch (e) {
      console.log(e)
    }
  }

  async function onResetPassword(index) {
    try {
      const user = {
        type: "reset-password",
        username: state.users[index].username,
        password: state.users[index].password,
      }

      const response = await Axios.patch("/user/users", user, { headers: { Authorization: `Bearer ${appState.token}` } })

      // Throw error if failed.
      if (response.status != 200) throw `Failed to update user ${state.username}.`
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div>
      <h2>Users</h2>
      <h3>User Creation</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Enabled</th>
            <th>Password</th>
            <th>Create User</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.username = e.target.value
                  })
                }}
                name="username"
                type="text"
                placeholder="Username"
                autoComplete="off"
                value={state.username}
              />
            </td>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.email = e.target.value
                  })
                }}
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="off"
                value={state.email}
              />
            </td>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.enabled = e.target.checked
                  })
                }}
                name="enabled"
                type="checkbox"
                checked={state.enabled}
              />
            </td>
            <input
              onChange={(e) => {
                setState((draft) => {
                  draft.password = e.target.value
                })
              }}
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="off"
              value={state.password}
            />
            <td>
              <button type="submit" onClick={onCreateUser}>
                Create User
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <h3>User List</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Enabled</th>
            <th>Update User</th>
            <th>Password</th>
            <th>Reset Password</th>
          </tr>
        </thead>
        <tbody>
          {state.users.map((user, index) => {
            return (
              <tr key={user.username}>
                <td>{user.username}</td>
                <td>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={user.email}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.users[index].email = e.target.value
                      })
                    }}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={user.enabled}
                    onChange={(e) => {
                      setState((draft) => {
                        // Do not allow super admin to be disabled.
                        if (draft.users[index].username != process.env.USER_SUPER_ADMIN) {
                          draft.users[index].enabled = Boolean(e.target.checked)
                        } else {
                          console.log(`Admin update user: Super admin ${process.env.USER_SUPER_ADMIN} cannot be disabled.`)
                        }
                      })
                    }}
                  />
                </td>
                <td>
                  <button
                    type="submit"
                    onClick={() => {
                      onUpdateUser(index)
                    }}
                  >
                    Update User
                  </button>
                </td>
                <td>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => {
                      setState((draft) => {
                        draft.users[index].password = e.target.value
                      })
                    }}
                  />
                </td>
                <td>
                  <button
                    type="submit"
                    onClick={() => {
                      onResetPassword(index)
                    }}
                  >
                    Reset Password
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default UserList
