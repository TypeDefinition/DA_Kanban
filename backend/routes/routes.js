const express = require("express")
const router = express.Router()

router.post("/register", (req, res) => {
  res.status(200).send("Register")
})

router.post("/login", (req, res) => {
  res.status(200).send("Login")
})

router.get("/users", (req, res) => {
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
