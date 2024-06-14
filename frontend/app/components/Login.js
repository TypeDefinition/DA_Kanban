import React, { useState, useContext } from "react"
import Axios from "axios"
import Page from "./Page"
import DispatchContext from "../contexts/DispatchContext"

function Login() {
  const appDispatch = useContext(DispatchContext)
  const [username, setUsername] = useState()
  const [password, setPassword] = useState()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      console.log("Before Send")
      const res = await Axios.post("/login", { username, password })
      console.log("After Send")
      if (res.status == 200) {
        appDispatch({ type: "login", token: res.token, username })
      }
    } catch (e) {
      console.log("Error thrown")
      console.log(e)
    }
  }

  return (
    <Page title="Login">
      <div>
        <h1>Task Management System Login</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              onChange={(e) => {
                setUsername(e.target.value)
              }}
              name="username"
              type="text"
              placeholder="Username"
              autoComplete="off"
            />
          </div>
          <div>
            <input
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              name="password"
              type="password"
              placeholder="Password"
            />
          </div>
          <div>
            <button type="submit">Log In</button>
          </div>
        </form>
      </div>
    </Page>
  )
}

export default Login
