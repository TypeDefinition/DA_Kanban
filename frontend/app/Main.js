// External Imports
import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useImmerReducer } from "use-immer"
import Modal from "react-modal"
import Axios from "axios"
import Cookies from "universal-cookie"

// Internal Imports
// Contexts
import DispatchContext from "./contexts/DispatchContext"
import StateContext from "./contexts/StateContext"

// Components
import NotFound from "./components/NotFound"
import AppMap from "./components/AppMap"
import AppPage from "./components/AppPage"
import Profile from "./components/Profile"
import UserManagement from "./components/UserManagement"
import ProtectedRoute from "./components/ProtectedRoute"
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"

// This is the backend URL.
Axios.defaults.baseURL = `http://localhost:${process.env.BACKEND_PORT}`

function Main() {
  const cookies = new Cookies()

  // Global state.
  const [state, dispatch] = useImmerReducer(stateReducer, {
    loggedIn: Boolean(cookies.get("token")),
    token: cookies.get("token"),
    username: cookies.get("username"),
    email: cookies.get("email"),
    isAdmin: Boolean(cookies.get("isAdmin")),
    isAppCreator: Boolean(cookies.get("isAppCreator")),
    isPlanCreator: Boolean(cookies.get("isPlanCreator")),
  })

  function stateReducer(draft, action) {
    switch (action.type) {
      case "login":
        draft.loggedIn = true
        draft.token = action.token
        draft.username = action.username
        draft.email = action.email
        draft.isAdmin = action.isAdmin
        draft.isAppCreator = action.isAppCreator
        draft.isPlanCreator = action.isPlanCreator
        break
      case "logout":
        draft.loggedIn = false
        draft.token = null
        draft.username = null
        draft.email = null
        draft.isAdmin = false
        draft.isAppCreator = false
        draft.isPlanCreator = false
        break
      case "update-email":
        draft.email = action.email
        break
      case "update-permissions":
        draft.email = action.email
        draft.isAdmin = action.isAdmin
        draft.isAppCreator = action.isAppCreator
        draft.isPlanCreator = action.isPlanCreator
        break
    }
  }

  // Manage cookies.
  useEffect(() => {
    if (state.loggedIn) {
      cookies.set("token", state.token, { path: "/" })
      cookies.set("username", state.username, { path: "/" })
      cookies.set("email", state.email, { path: "/" })
      cookies.set("isAdmin", state.isAdmin, { path: "/" })
      cookies.set("isAppCreator", state.isAppCreator, { path: "/" })
      cookies.set("isPlanCreator", state.isPlanCreator, { path: "/" })
    } else {
      cookies.remove("token", { path: "/" })
      cookies.remove("username", { path: "/" })
      cookies.remove("email", { path: "/" })
      cookies.remove("isAdmin", { path: "/" })
      cookies.remove("isAppCreator", { path: "/" })
      cookies.remove("isPlanCreator", { path: "/" })
    }
  }, [state])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppMap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/management"
              element={
                <ProtectedAdminRoute>
                  <UserManagement />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/applications/:acronym"
              element={
                <ProtectedRoute>
                  <AppPage />
                </ProtectedRoute>
              }
            />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

Modal.setAppElement("#app")

const root = ReactDOM.createRoot(document.querySelector("#app"))
root.render(<Main />)

// This lets the webpage update whenever we make any changes, without needing to refresh.
if (module.hot) {
  module.hot.accept()
}
