import React, { useContext, useEffect } from "react"
import Select from "react-select"
import Axios from "axios"
import Status from "./Status"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function UserList({ state, setState }) {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)

  // Retrieve users from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.get("/user/users", {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${globalState.token}`,
          },
        })

        // Unauthorised access.
        if (response.status == Status.unauthorised) {
          setState((draft) => {
            draft.groups = []
            draft.users = []
          })
          globalDispatch({ type: "logout" })
        }

        // Success.
        if (response.status == Status.ok) {
          const users =
            response.data.users.map((element) => {
              return {
                username: element.username,
                password: null,
                email: element.email,
                enabled: Boolean(element.enabled),
                groups: element.groups,
                status: "",
              }
            }) || []

          setState((draft) => {
            draft.users = users
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

  async function onCreateUser() {
    try {
      setState((draft) => {
        draft.newUserStatus = "..."
        draft.newUserStatusColour = "black"
      })

      const user = {
        username: state.newUsername,
        password: state.newPassword,
        email: state.newEmail,
        enabled: Boolean(state.newEnabled),
        groups: state.newGroups,
        status: "",
        statusColour: "black",
      }

      const response = await Axios.post("/user/users", user, { headers: { Authorization: `Bearer ${globalState.token}` } })

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.newUserStatus = response.data.message
          draft.newUserStatusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        // Append to user list.
        setState((draft) => {
          draft.newUserStatus = response.data.message
          draft.newUserStatusColour = "green"
          draft.users.push(user)
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function onUpdateUser(index) {
    try {
      setState((draft) => {
        draft.users[index].status = "..."
        draft.users[index].statusColour = "black"
      })

      const user = {
        type: "update-user",
        username: state.users[index].username,
        email: state.users[index].email,
        enabled: state.users[index].enabled,
        groups: state.users[index].groups,
      }

      const response = await Axios.patch("/user/users", user, { headers: { Authorization: `Bearer ${globalState.token}` } })

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.users[index].status = response.data.message
          draft.users[index].statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setState((draft) => {
          draft.users[index].status = response.data.message
          draft.users[index].statusColour = "green"
        })

        // Check if the admin updated himself/herself.
        if (user.username == globalState.username) {
          const enabled = Boolean(response.data.enabled)
          const isAdmin = Boolean(response.data.isAdmin)
          const isAppCreator = Boolean(response.data.isAppCreator)
          const isPlanCreator = Boolean(response.data.isPlanCreator)

          // User is no longer authorised! Clear all user and group data and log out.
          if (!enabled) {
            globalDispatch({ type: "logout" })
            return
          }

          // Update our global state.
          globalDispatch({
            type: "update-permissions",
            email: response.data.email,
            isAdmin,
            isAppCreator,
            isPlanCreator,
          })
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function onResetPassword(index) {
    try {
      setState((draft) => {
        draft.users[index].status = "..."
        draft.users[index].statusColour = "black"
      })

      const user = {
        type: "reset-password",
        username: state.users[index].username,
        password: state.users[index].password,
      }

      const response = await Axios.patch("/user/users", user, { headers: { Authorization: `Bearer ${globalState.token}` } })

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        setState((draft) => {
          draft.groups = []
          draft.users = []
        })
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.users[index].status = response.data.message
          draft.users[index].statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setState((draft) => {
          draft.users[index].status = response.data.message
          draft.users[index].statusColour = "green"
        })
      }
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
            <th>Groups</th>
            <th>Password</th>
            <th>Create User</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input
                name="username"
                type="text"
                placeholder="Username"
                autoComplete="off"
                value={state.newUsername}
                onChange={(e) => {
                  setState((draft) => {
                    draft.newUsername = e.target.value
                  })
                }}
              />
            </td>
            <td>
              <input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="off"
                value={state.newEmail}
                onChange={(e) => {
                  setState((draft) => {
                    draft.newEmail = e.target.value
                  })
                }}
              />
            </td>
            <td>
              <input
                name="enabled"
                type="checkbox"
                checked={state.newEnabled}
                onChange={(e) => {
                  setState((draft) => {
                    draft.newEnabled = e.target.checked
                  })
                }}
              />
            </td>
            <td>
              <Select
                options={state.groups.map((group) => {
                  return { value: group, label: group }
                })}
                isMulti
                value={state.newGroups.map((group) => {
                  return { value: group, label: group }
                })}
                onChange={(e) => {
                  setState((draft) => {
                    draft.newGroups = e.map((element) => element.value)
                  })
                }}
              />
            </td>
            <td>
              <input
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="off"
                value={state.newPassword}
                onChange={(e) => {
                  setState((draft) => {
                    draft.newPassword = e.target.value
                  })
                }}
              />
            </td>
            <td>
              <button type="submit" onClick={onCreateUser}>
                Create User
              </button>
            </td>
            <td>
              <font color={state.newUserStatusColour}>{state.newUserStatus}</font>
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
            <th>Groups</th>
            <th>Update User</th>
            <th>Password</th>
            <th>Reset Password</th>
            <th>Status</th>
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
                        draft.users[index].status = "Pending changes..."
                        draft.users[index].statusColour = "black"
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
                    disabled={state.users[index].username == process.env.USER_SUPER_ADMIN} // Do not allow super admin to be disabled.
                    onChange={(e) => {
                      setState((draft) => {
                        draft.users[index].status = "Pending changes..."
                        draft.users[index].statusColour = "black"
                        draft.users[index].enabled = Boolean(e.target.checked)
                      })
                    }}
                  />
                </td>
                <td>
                  <Select
                    options={state.groups.map((group) => {
                      return { value: group, label: group }
                    })}
                    isMulti
                    value={user.groups.map((group) => {
                      return { value: group, label: group }
                    })}
                    onChange={(e) => {
                      setState((draft) => {
                        draft.users[index].status = "Pending changes..."
                        draft.users[index].statusColour = "black"

                        // Do not allow super admin to remove admin role.
                        const assignedGroups = e.map((element) => element.value)
                        const isSuperAdmin = draft.users[index].username == process.env.USER_SUPER_ADMIN
                        const inAdminGroup = assignedGroups.includes(process.env.GROUP_ADMIN)
                        if (isSuperAdmin && !inAdminGroup) {
                          draft.users[index].status = `Super admin must be in ${process.env.GROUP_ADMIN} group!`
                          draft.users[index].statusColour = "red"
                          console.log(`Admin update user: Super admin ${process.env.USER_SUPER_ADMIN} must be in ${process.env.GROUP_ADMIN} group.`)
                        } else {
                          draft.users[index].groups = assignedGroups
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
                        draft.users[index].statusColour = "black"
                        if (draft.users[index].password) {
                          draft.users[index].status = "Pending changes..."
                        } else {
                          draft.users[index].status = ""
                        }
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
                <td>
                  <font color={user.statusColour}>{user.status}</font>
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
