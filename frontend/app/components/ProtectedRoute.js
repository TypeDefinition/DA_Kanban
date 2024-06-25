import React, { useContext } from "react"
import Axios from "axios"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"
import Login from "./Login"

const ProtectedRoute = (props) => {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  async function doQuery() {
    try {
      const response = await Axios.get("/user/authenticate", { headers: { Authorization: `Bearer ${appState.token}` } })
      if (response.status != 200) {
        appDispatch({ type: "logout" })
        return
      }

      const enabled = Boolean(response.data.enabled)
      if (!enabled) {
        appDispatch({ type: "logout" })
        return
      }

      const isAdmin = Boolean(response.data.isAdmin)
      const isAppCreator = Boolean(response.data.isAppCreator)
      const isPlanCreator = Boolean(response.data.isPlanCreator)

      appDispatch({
        type: "update-permissions",
        email: response.data.email,
        isAdmin,
        isAppCreator,
        isPlanCreator,
      })
    } catch (e) {
      console.log(e)
      appDispatch({ type: "logout" })
    }
  }
  doQuery()

  if (!appState.loggedIn) return <Login />

  return props.children
}

export default ProtectedRoute
