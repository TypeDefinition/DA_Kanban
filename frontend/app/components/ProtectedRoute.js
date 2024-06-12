import React, { useContext } from "react"
import Axios from "axios"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"
import Login from "./Login"

const ProtectedRoute = (props) => {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)

  async function doQuery() {
    try {
      const response = await Axios.get("/user/authenticate", { headers: { Authorization: `Bearer ${globalState.token}` } })
      if (response.status != 200) {
        globalDispatch({ type: "logout" })
        return
      }

      const enabled = Boolean(response.data.enabled)
      if (!enabled) {
        globalDispatch({ type: "logout" })
        return
      }

      const isAdmin = Boolean(response.data.isAdmin)
      const isAppCreator = Boolean(response.data.isAppCreator)
      const isPlanCreator = Boolean(response.data.isPlanCreator)

      globalDispatch({
        type: "update-permissions",
        email: response.data.email,
        isAdmin,
        isAppCreator,
        isPlanCreator,
      })
    } catch (e) {
      console.log(e)
      globalDispatch({ type: "logout" })
    }
  }
  doQuery()

  if (!globalState.loggedIn) return <Login />

  return props.children
}

export default ProtectedRoute
