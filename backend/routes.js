// Imports
const db = require("./database")
const express = require("express")

const router = express.Router()

router.post("/register", (req, res) => {
  async function doQuery(req, res) {
    const { username, password, email } = req.body

    // Because username, password and email are untrusted data from the end user,
    // we cannot add it directly to the query in case of injection attacks.
    // We instead use ?, and then pass in the values as an array at the end.
    try {
      const queryStatement = `INSERT INTO account (username, password, email, is_admin, is_enabled) VALUES (?, ?, ?, false, true);`
      const result = await db.query(queryStatement, [username, password, email])
      console.log(result)
      res.status(200).send("Success")
    } catch (e) {
      console.log(e)
      let msg = "Unknown error."
      switch (e.code) {
        case "ER_DUP_ENTRY":
          msg = "This username or email has already been used."
          break
        case "ER_BAD_NULL_ERROR":
          msg = "All required fields cannot be empty."
          break
      }
      res.status(400).send(msg)
    }
  }
  doQuery(req, res)
})

router.post("/login", (req, res) => {
  res.status(200).send("Login")
})

router.get("/users", (req, res) => {
  async function doQuery(req, res) {
    try {
      const queryStatement = `SELECT username, email, is_admin, is_enabled FROM account;`
      const [rows] = await db.query(queryStatement)
      console.log(rows)
      res.status(200).send(rows)
    } catch (e) {
      console.log(e.sqlMessage)
      res.status(400).send("Bad request.")
    }
  }
  doQuery(req, res)
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
