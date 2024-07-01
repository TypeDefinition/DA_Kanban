import React, { useContext } from "react"
import Page from "./Page"
import Header from "./Header"
import { AppCard } from "./AppCard"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./AppMenu.css"

function AppMenu() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  return (
    <Page title="Application Menu">
      <Header />
      <div>
        <h1>Application Menu</h1>
      </div>
      <div className="app-grid">
        <AppCard />
      </div>
    </Page>
  )
}

export default AppMenu
