import React, { useContext } from "react"
import Page from "./Page"
import Header from "./Header"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function AppMenu() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  return (
    <Page title="Application Menu">
      <Header />
      <div>
        <h1>Application Menu</h1>
      </div>
    </Page>
  )
}

export default AppMenu
