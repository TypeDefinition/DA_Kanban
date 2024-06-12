// Imports
const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")
const path = require("path")
const mysql = require("mysql")

// Routes
const routes = require("./routes/routes")
const port = process.env.PORT || 3501

// Our backend application.
const app = express()

// Inititalize the app and add middleware
app.use(bodyParser.urlencoded({ extended: true })) // Setup the body parser to handle form submits.
app.use(session({ secret: "super-secret" })) // Session setup.

// Create a HTTP server, and start listening to a port.
app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`)
})

// Tell our app to listen for these routes.
app.use("", routes)
