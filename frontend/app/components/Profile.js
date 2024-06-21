import React, { useState, useContext } from "react"
import Axios from "axios"
import Page from "./Page"
import Header from "./Header"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function Profile() {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  // Update password and email.
  const [password, setPassword] = useState()
  const [email, setEmail] = useState()

  async function onUpdatePassword(event) {
    event.preventDefault()
    try {
      const response = await Axios.patch(
        "/user/profile",
        { type: "password", password },
        {
          headers: {
            Authorization: `Bearer ${appState.token}`, // Note: Authorization must start with a capital letter.
          },
        }
      )

      // Throw error if failed.
      if (response.status != 200) throw `User ${appState.username}: Failed to update password.`
    } catch (e) {
      console.log(e)
    }
  }

  async function onUpdateEmail(event) {
    event.preventDefault()
    try {
      console.log(appState.token)
      const response = await Axios.patch(
        "/user/profile",
        { type: "email", email },
        {
          headers: {
            Authorization: `Bearer ${appState.token}`, // Note: Authorization must start with a capital letter.
          },
        }
      )

      // Throw error if failed.
      if (response.status != 200) throw `User ${appState.username}: Failed to update email.`

      // Update state if success.
      appDispatch({ type: "updateProfile", email })
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Page title="Profile">
      <Header />
      <div>
        <h1>Profile Management</h1>
        <p>Username: {appState.username}</p>
        <p>Password: ********</p>
        <p>Email: {appState.email}</p>
        <form onSubmit={onUpdatePassword}>
          <div>
            <input
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              name="password"
              type="password"
              placeholder="New Password"
              autoComplete="off"
            />
          </div>
          <div>
            <button type="submit">Update Password</button>
          </div>
        </form>
        <form onSubmit={onUpdateEmail}>
          <div>
            <input
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              name="email"
              type="email"
              placeholder="New Email"
              autoComplete="off"
            />
          </div>
          <div>
            <button type="submit">Update Email</button>
          </div>
        </form>
      </div>
    </Page>
  )
}

export default Profile
