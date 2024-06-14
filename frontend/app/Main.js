// External Imports
import React, { useEffect, useState, useReducer, act } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useImmerReducer } from "use-immer"
import Axios from "axios"
import Cookies from "universal-cookie"

// Internal Imports
// Contexts
import DispatchContext from "./contexts/DispatchContext"
import StateContext from "./contexts/StateContext"

// Components
import AppMenu from "./components/AppMenu"
import Login from "./components/Login"
import NotFound from "./components/NotFound"

// This is the backend URL.
Axios.defaults.baseURL = "http://localhost:3501"

function Main() {
  const cookies = new Cookies()

  // Manage state.
  const initialState = {
    loggedIn: Boolean(cookies.get("token")),
    token: cookies.get("token"),
    username: cookies.get("username"),
  }
  function ourReducer(draft, action) {
    switch (action.type) {
      case "login":
        draft.loggedIn = true
        draft.token = action.token
        draft.username = action.username
        break
      case "logout":
        draft.loggedIn = false
        break
    }
  }
  const [state, dispatch] = useImmerReducer(ourReducer, initialState)

  // Manage cookies.
  useEffect(() => {
    if (state.loggedIn) {
      cookies.set("token", state.token)
      cookies.set("username", state.username)
    } else {
      cookies.remove("token")
      cookies.remove("username")
    }
  }, [state.loggedIn])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={state.loggedIn ? <AppMenu /> : <Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

const root = ReactDOM.createRoot(document.querySelector("#app"))
root.render(<Main />)

// This lets the webpage update whenever we make any changes, without needing to refresh.
if (module.hot) {
  module.hot.accept()
}
