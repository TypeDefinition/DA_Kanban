import React from "react"
import "./AppCard.css"
import { Link } from "react-router-dom"

function AppCard(props) {
  function onEdit(e) {
    console.log(e)
  }

  const maxDescLength = 32
  let shortenedDesc = props.app.desc
  if (props.app.desc.length > maxDescLength) {
    shortenedDesc = props.app.desc.substr(0, maxDescLength - 1) + "\u2026"
  }

  const startDate = props.app.startDate.getFullYear() + "-" + props.app.startDate.getMonth() + "-" + props.app.startDate.getDate()
  const endDate = props.app.endDate.getFullYear() + "-" + props.app.endDate.getMonth() + "-" + props.app.endDate.getDate()

  return (
    <div className="app-card">
      <div className="app-card-info">
        <Link to={`/app/${props.app.name}`}>
          <p>R-Number: {props.app.rnum}</p>
          <p>Name: {props.app.name}</p>
          <p>Description: {shortenedDesc}</p>
          <p>
            Duration: {startDate} to {endDate}
          </p>
        </Link>
      </div>
      <div className="app-card-edit">
        <button onClick={onEdit}>Edit</button>
      </div>
    </div>
  )
}

export default AppCard
