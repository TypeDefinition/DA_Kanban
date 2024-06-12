import React, { useState, useContext } from "react"
import Axios from "axios"
import Page from "./Page"
import Header from "./Header"
import Status from "./Status"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function Profile() {
  const globalDispatch = useContext(DispatchContext)
  const globalState = useContext(StateContext)

  // Update password and email.
  const [password, setPassword] = useState()
  const [email, setEmail] = useState()
  const [status, setStatus] = useState("")

  async function onUpdatePassword(event) {
    event.preventDefault()
    try {
      const response = await Axios.patch(
        "/user/profile",
        { type: "password", password },
        {
          headers: {
            Authorization: `Bearer ${globalState.token}`, // Note: Authorization must start with a capital letter.
          },
        }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setStatus(response.data.message)
      }

      // Success.
      if (response.status == Status.ok) {
        setStatus(response.data.message)
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function onUpdateEmail(event) {
    event.preventDefault()
    try {
      const response = await Axios.patch(
        "/user/profile",
        { type: "email", email },
        {
          headers: {
            Authorization: `Bearer ${globalState.token}`, // Note: Authorization must start with a capital letter.
          },
        }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setStatus(response.data.message)
      }

      // Success.
      if (response.status == Status.ok) {
        setStatus(response.data.message)
        globalDispatch({ type: "update-email", email })
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Page title="Profile">
      <Header />
      <div>
        <h1>Profile Management</h1>
        <p>Username: {globalState.username}</p>
        <p>Password: ********</p>
        <p>Email: {globalState.email}</p>
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
        <p>
          <font color="red">{status}</font>
        </p>
      </div>
    </Page>
  )
}

export default Profile
