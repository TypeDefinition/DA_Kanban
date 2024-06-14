import React from "react"
import { Link } from "react-router-dom"
import Page from "./Page"

function NotFound() {
  return (
    <Page title="Not Found">
      <div className="text-center">
        <h2>Page not found.</h2>
        <p>
          Return to <Link to="/">homepage</Link>.
        </p>
      </div>
    </Page>
  )
}

export default NotFound
