import React, { useContext } from "react"
import { useNavigate } from "react-router-dom"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function Header() {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)
  const navigate = useNavigate()

  return (
    <header>
      <div>
        <button
          onClick={() => {
            navigate("/")
          }}
        >
          Home
        </button>{" "}
        <button
          onClick={() => {
            navigate("/user/profile")
          }}
        >
          Profile
        </button>{" "}
        {appState.isAdmin && (
          <>
            <button
              onClick={() => {
                navigate("/user/management")
              }}
            >
              User Management
            </button>{" "}
          </>
        )}
        <button
          onClick={() => {
            appDispatch({ type: "logout" })
            navigate("/")
          }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Header
