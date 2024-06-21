import React, { useContext } from "react"
import Page from "./Page"
import Header from "./Header"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

// Components
import UserList from "./UserList"
import GroupList from "./GroupList"

function UserManagement() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  return (
    <Page title="User Management">
      <Header />
      <div>
        <h1>User Management</h1>
        <GroupList />
        <UserList />
      </div>
    </Page>
  )
}

export default UserManagement
