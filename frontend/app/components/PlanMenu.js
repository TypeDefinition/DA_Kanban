import React, { useContext, useEffect } from "react"
import { useImmer } from "use-immer"
import Axios from "axios"
import Status from "./Status"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

import "./PlanMenu.css"

function PlanMenu({ parentState, setParentState }) {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)

  const [state, setState] = useImmer({
    name: "",
    startDate: "2025-01-01",
    endDate: "2025-01-31",

    status: "",
    statusColour: "black",
  })

  async function onCreatePlan() {
    try {
      setState((draft) => {
        draft.status = "..."
        draft.statusColour = "black"
      })

      const response = await Axios.post(
        `/applications/plans/create`,
        {
          acronym: `${parentState.app.acronym}`,
          name: state.name,
          startDate: state.startDate,
          endDate: state.endDate,
        },
        { headers: { Authorization: `Bearer ${globalState.token}` } }
      )

      // Unauthorised access.
      if (response.status == Status.unauthorised) {
        globalDispatch({ type: "logout" })
      }

      // Standard error.
      if (response.status == Status.error) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "red"
        })
      }

      // Success.
      if (response.status == Status.ok) {
        setState((draft) => {
          draft.status = response.data.message
          draft.statusColour = "green"
        })

        setParentState((draft) => {
          draft.plans.push({
            name: response.data.plan.name,
            startDate: response.data.plan.startDate,
            endDate: response.data.plan.endDate,
          })
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className="plan-menu">
      <div style={{ float: "right", padding: "1rem" }}>
        <button
          onClick={() => {
            setParentState((draft) => {
              draft.enablePlanMenu = false
            })
          }}
        >
          X
        </button>
      </div>

      <h2>Plans</h2>

      <div className="plan-table">
        <table border="1">
          <thead>
            <tr align="center">
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {parentState.plans.map((plan) => {
              return (
                <tr key={plan.name}>
                  <td>{plan.name}</td>
                  <td>{plan.startDate}</td>
                  <td>{plan.endDate}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.name = e.target.value
                  })
                }}
                type="text"
                placeholder="Plan Name"
                autoComplete="off"
              />
            </td>
          </tr>
          <tr>
            <th>Start Date</th>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.startDate = new Date(e.target.value).toISOString().split("T")[0]
                  })
                }}
                value={state.startDate}
                type="date"
                autoComplete="off"
              />
            </td>
          </tr>
          <tr>
            <th>End Date</th>
            <td>
              <input
                onChange={(e) => {
                  setState((draft) => {
                    draft.endDate = new Date(e.target.value).toISOString().split("T")[0]
                  })
                }}
                value={state.endDate}
                type="date"
                autoComplete="off"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ float: "right" }}>
        <button onClick={onCreatePlan}>Create Plan</button>
      </div>

      <p>
        <font color={state.statusColour}>{state.status}</font>
      </p>
    </div>
  )
}

export default PlanMenu
