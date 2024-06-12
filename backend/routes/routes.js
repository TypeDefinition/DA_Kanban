const express = require("express")
const router = express.Router()

router.post("/register", (req, res) => {
  res.status(200).json({ success: true })
})

router.post("/login", (req, res) => {})

router.get("/users", (req, res) => {})

router.get("/user/:id", (req, res) => {
  // Check if token user is same is :id.
  // If true, return user details. (excluding password)
})

module.exports = router
