// Imports
const express = require("express")
const session = require("express-session")
const path = require("path")

// Routes
const routes = require("./routes")

// Our backend application.
const app = express()

// Inititalize the app and add middleware
app.use(express.urlencoded({ extended: true })) // Setup the body parser to handle form submits.
app.use(express.json())
app.use(session({ secret: "super-secret" })) // Session setup.

// Create a HTTP server, and start listening to a port.
app.listen(process.env.PORT, () => {
  console.log(`Backend listening at http://localhost:${process.env.PORT}`)
})

// Tell our app to listen for these routes.
app.use("", routes)
