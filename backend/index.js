// Imports
const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")
const path = require("path")
const mysql = require("mysql2")

// Routes
const routes = require("./routes/routes")

// Our backend application.
const app = express()

// Our database connection.
const db = mysql.createConnection({
  host: `${DB_HOST}`,
  user: `${process.env.DB_USERNAME}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
})
db.connect((err) => {
  if (err) throw err
  console.log("MySQL connected.")
})

// Inititalize the app and add middleware
app.use(bodyParser.urlencoded({ extended: true })) // Setup the body parser to handle form submits.
app.use(session({ secret: "super-secret" })) // Session setup.

// Create a HTTP server, and start listening to a port.
app.listen(process.env.PORT, () => {
  console.log(`Backend listening at http://localhost:${process.env.PORT}`)
})

// Tell our app to listen for these routes.
app.use("", routes)
