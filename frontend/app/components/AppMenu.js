import React, { useContext } from "react"
import Page from "./Page"
import StateContext from "../contexts/StateContext"

function AppMenu() {
  const appState = useContext(StateContext)

  return (
    <Page title="App Menu">
      <div>
        <h1>Welcome</h1>
      </div>
    </Page>
  )
}

export default AppMenu
