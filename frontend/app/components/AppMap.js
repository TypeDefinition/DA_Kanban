import React, { useContext, useEffect } from "react"
import { useImmer } from "use-immer"
import Modal from "react-modal"
import Axios from "axios"
import Status from "./Status"
import Page from "./Page"
import Header from "./Header"
import AppCard from "./AppCard"
import AppMenu from "./AppMenu"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./AppMap.css"

function AppMap() {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)

  const [state, setState] = useImmer({
    apps: [],

    menu: {
      type: "create",
      acronym: "",
      enable: false,
    },
  })

  // Retrieve apps from backend.
  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        const response = await Axios.get("/applications", {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${globalState.token}`,
          },
        })

        // Unauthorised access.
        if (response.status == Status.unauthorised) {
          globalDispatch({ type: "logout" })
        }

        // Success.
        if (response.status == Status.ok) {
          setState((draft) => {
            draft.apps = response.data.apps || []
          })
        }
      } catch (e) {
        console.log(e)
      }
    }
    fetchData()
    return () => {
      controller.abort()
    }
  }, [])

  return (
    <Page title="Applications">
      <Modal isOpen={state.menu.enable}>
        <AppMenu parentState={state} setParentState={setState} />
      </Modal>

      <Header />

      {globalState.isAppCreator && (
        <div style={{ textAlign: "right", padding: "2rem" }}>
          <button
            onClick={() => {
              setState((draft) => {
                draft.menu.type = "create"
                draft.menu.enable = true
              })
            }}
          >
            Create App
          </button>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <h1>Applications</h1>
      </div>
      <div className="app-grid">
        {state.apps.map((app) => {
          return <AppCard app={app} key={app.acronym} parentState={state} setParentState={setState} />
        })}
      </div>
    </Page>
  )
}

export default AppMap
