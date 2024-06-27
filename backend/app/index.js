// Imports
const express = require("express")
const session = require("express-session")
const cors = require("cors")

// Routes
const routes = require("./routes")

// Our backend application.
const app = express()

// Inititalize the app and add middleware
app.use(cors()) // Allows anyone to connect.
app.use(express.urlencoded({ extended: true })) // Setup the body parser to handle form submits.
app.use(express.json())
app.use(session({ secret: "SuperSecret" })) // Session setup.

// Create a HTTP server, and start listening to a port.
app.listen(process.env.PORT, () => {
  console.log(`Backend listening at http://localhost:${process.env.PORT}`)
})

// Tell our app to listen for these routes.
app.use("", routes)
