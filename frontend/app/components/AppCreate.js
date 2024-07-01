import React, { useContext } from "react"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./AppCreate.css"

function AppCreate() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  return (
    <div className="app-create">
      <h1>Create Application</h1>
      <div>
        <input type="text" placeholder="Name" autoComplete="off" />
      </div>
      <div>
        <input type="text" placeholder="R-Number" autoComplete="off" />
      </div>
      <div>
        <textarea type="text" placeholder="Description" autoComplete="off" />
      </div>
    </div>
  )
}

export default AppCreate
