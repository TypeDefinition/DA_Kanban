import React, { useContext } from "react"
import "./AppCard.css"
import { Link } from "react-router-dom"
import StateContext from "../contexts/StateContext"
import DispatchContext from "../contexts/DispatchContext"

function AppCard({ app, parentState, setParentState }) {
  const globalState = useContext(StateContext)
  const globalDispatch = useContext(DispatchContext)

  function onEdit(e) {
    setParentState((draft) => {
      draft.menu.acronym = app.acronym
      draft.menu.type = "edit"
      draft.menu.enable = true
    })
    console.log(e)
  }

  const maxDescLength = 32
  let shortDesc = app.description
  if (shortDesc.length > maxDescLength) {
    shortDesc = shortDesc.substr(0, maxDescLength - 1) + "..."
  }

  return (
    <div className="app-card">
      <div style={{ textAlign: "right" }}>{globalState.isAppCreator && <button onClick={onEdit}>Edit</button>}</div>
      <div>
        <Link to={`/applications/${app.acronym}`} style={{ textDecoration: "none" }}>
          <p>Rnum: {app.rnumber}</p>
          <p>Name: {app.acronym}</p>
          <p>Desc: {shortDesc}</p>
          <p>
            Duration: {app.startDate} to {app.endDate}
          </p>
        </Link>
      </div>
    </div>
  )
}

export default AppCard
