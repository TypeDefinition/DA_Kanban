import React, { useState, useContext } from "react"
import Axios from "axios"
import Page from "./Page"
import DispatchContext from "../contexts/DispatchContext"

function Login() {
  const globalDispatch = useContext(DispatchContext)
  const [username, setUsername] = useState()
  const [password, setPassword] = useState()
  const [status, setStatus] = useState("")

  async function onLogin(event) {
    event.preventDefault()
    try {
      const response = await Axios.post("/login", { username, password })

      if (response.status != 200) throw "Login failed."

      globalDispatch({
        type: "login",
        token: response.data.token,
        username: response.data.username,
        email: response.data.email,
        isAdmin: response.data.isAdmin,
        isAppCreator: response.data.isAppCreator,
        isPlanCreator: response.data.isPlanCreator,
      })
    } catch (e) {
      console.log(e)
      setStatus("Invalid username or password.")
    }
  }

  return (
    <Page title="Login">
      <div>
        <h1>Task Management System Login</h1>
        <form onSubmit={onLogin}>
          <div>
            {"Username: "}
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
          <br />
          <div>
            {"Password: "}
            <input
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              name="password"
              type="password"
              placeholder="Password"
            />
          </div>
          <br />
          <div>
            <button type="submit">Login</button>
          </div>
        </form>
        <br />
        <p>
          <font color="red">{status}</font>
        </p>
      </div>
    </Page>
  )
}

export default Login
