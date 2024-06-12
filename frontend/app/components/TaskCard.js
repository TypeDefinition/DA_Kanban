import React, { useContext, useEffect } from "react"
import { useImmer } from "use-immer"
import Select from "react-select"
import Axios from "axios"
import Status from "./Status"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./TaskCard.css"

function TaskCard({ parentState, setParentState, task }) {
  const maxDescLength = 32
  let shortDesc = task.description
  if (shortDesc.length > maxDescLength) {
    shortDesc = shortDesc.substr(0, maxDescLength - 1) + "..."
  }

  async function onOpenMenu() {
    setParentState((draft) => {
      draft.taskMenuId = task.id
      draft.enableTaskMenu = true
    })
  }

  return (
    <div className="task-card">
      <div className="task-plan">
        <h3>{task.plan ? task.plan : "No Plan"}</h3>
      </div>
      <h4>{task.id}</h4>
      <table>
        <tbody valign="top">
          <tr>
            <td>Name: </td>
            <td>{task.name}</td>
          </tr>
          <tr>
            <td>Description: </td>
            <td>{shortDesc}</td>
          </tr>
          <tr>
            <td>Owner: </td>
            <td>{task.owner}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onOpenMenu}>{"Edit"}</button>
      </div>
    </div>
  )
}

export default TaskCard
