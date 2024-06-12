import React from "react"
import { useImmer } from "use-immer"
import Page from "./Page"
import Header from "./Header"
import GroupList from "./GroupList"
import UserList from "./UserList"

function UserManagement() {
  const [state, setState] = useImmer({
    // Create group.
    newGroup: "",
    newGroupStatus: "",
    newGroupStatusColour: "red",
    // Create user.
    newUsername: "",
    newPassword: "",
    newEmail: "",
    newEnabled: true,
    newGroups: [],
    newUserStatus: "",
    newUserStatusColour: "red",
    // Existing groups.
    groups: [],
    // Existing users.
    users: [],
  })

  return (
    <Page title="User Management">
      <Header />
      <div>
        <h1>User Management</h1>
        <GroupList state={state} setState={setState} />
        <UserList state={state} setState={setState} />
      </div>
    </Page>
  )
}

export default UserManagement
