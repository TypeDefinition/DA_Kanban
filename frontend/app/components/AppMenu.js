import React, { useContext } from "react"
import Page from "./Page"
import Header from "./Header"
import AppCard from "./AppCard"
import AppCreate from "./AppCreate"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./AppMenu.css"

function AppMenu() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const app = {
    name: "App Name",
    rnum: 10,
    desc: "My super duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper duper long description.",
    startDate: new Date(),
    endDate: new Date(),
  }

  return (
    <Page title="Applications">
      <Header />
      <div>
        <h1>Applications</h1>
      </div>
      <div>
        <AppCreate />
      </div>
      <div className="app-grid">
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
        <AppCard app={app} />
      </div>
    </Page>
  )
}

export default AppMenu
