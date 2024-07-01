import React from "react"
import "./AppCard.css"
import { Link } from "react-router-dom"

export const AppCard = (props) => {
  function onEdit(e) {
    console.log(e)
  }

  return (
    <div className="app-card">
      <div className="app-card-info">
        <Link to={`/app/${props.appName}`}>
          <p>R-Number: {props.rnum}</p>
          <p>Name: {props.name}</p>
          <p>Description: {props.desc}</p>
          <p>
            Duration: {props.start} - {props.end}
          </p>
        </Link>
      </div>
      <div className="app-card-edit">
        <button onClick={onEdit}>Edit</button>
      </div>
    </div>
  )
}
