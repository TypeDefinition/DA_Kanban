import React, { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import Axios from "axios"
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
          Application Menu
        </button>{" "}
        <button
          onClick={() => {
            navigate("/user/profile")
          }}
        >
          My Profile
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
