// Imports
const db = require("./database")
const express = require("express")

const router = express.Router()

router.post("/register", (req, res) => {
  const { username, password, email } = req.body
  console.log(`${username}`)
  console.log(`${password}`)
  console.log(`${email}`)

  const queryStatement = `INSERT INTO account (username, password, email, is_admin, is_enabled) VALUES ('${username}', '${password}', '${email}', false, true);`
  const result = db.query(queryStatement)

  // Find out via result if it succeeded or failed.
  console.log(result)
  res.status(200).send("Register")
})

router.post("/login", (req, res) => {
  res.status(200).send("Login")
})

router.get("/users", (req, res) => {
  // Do not select password.
  const queryStatement = `SELECT (username, email, is_admin, is_enabled) from accounts;`
  const result = db.query(queryStatement)
  console.log(result)

  res.status(200).send("Get All Users")
})

router.get("/user/:id", (req, res) => {
  // Check if token user is same is :id.
  // If true, return user details. (excluding password)
  res.status(200).send("Get User")
})

router.patch("/user/:id/password", (req, res) => {
  res.status(200).send("Change Password")
})

router.patch("/user/:id/email", (req, res) => {
  res.status(200).send("Change Email")
})

router.patch("/user/:id/enabled", (req, res) => {
  res.status(200).send("Change Enabled")
})

module.exports = router
