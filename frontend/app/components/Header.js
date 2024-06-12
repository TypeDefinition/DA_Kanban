import React, { useContext } from "react"
import { useNavigate } from "react-router-dom"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function Header() {
  const globalDispatch = useContext(DispatchContext)
  const globalState = useContext(StateContext)
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
        {globalState.isAdmin && (
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
            globalDispatch({ type: "logout" })
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
