import React, { useContext, useEffect } from "react"
import TaskCard from "./TaskCard"

import "./TaskList.css"

function TaskList({ taskState, parentState, setParentState }) {
  return (
    <div className="task-list">
      <table>
        <tbody>
          {parentState.tasks
            .filter((task) => task.state === taskState)
            .map((task, index) => {
              return (
                <tr key={index}>
                  <td>
                    <TaskCard parentState={parentState} setParentState={setParentState} task={task} />
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

export default TaskList
