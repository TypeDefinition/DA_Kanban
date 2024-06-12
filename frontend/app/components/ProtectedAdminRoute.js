import React, { useContext } from "react"
import Axios from "axios"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"
import Login from "./Login"
import NotFound from "./NotFound"

// 99% the same code as ProtectedRoute.
// Bad practice but I don't think I care anymore.
const ProtectedAdminRoute = (props) => {
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
      return false
    }
  }
  doQuery()

  /* Even though doQuery() is async and globalState might not be correct anymore,
     it's okay to just return these because in a few miliseconds we'll kick
     the user out if they are disabled. */
  if (!globalState.loggedIn) return <Login />
  if (!globalState.isAdmin) return <NotFound />

  return props.children
}

export default ProtectedAdminRoute
