const express = require("express")

// Controllers.
const asn3_controller = require("./asn3_controller")

// Express router.
const router = express.Router()

/******************** Assignment 3 ********************/
// Reject task.
router.post("/CreateTask", (req, res) => {
  asn3_controller.CreateTask(req, res)
})

router.post("/GetTaskbyState", (req, res) => {
  asn3_controller.GetTaskbyState(req, res)
})

router.patch("/PromoteTask2Done", (req, res) => {
  asn3_controller.PromoteTask2Done(req, res)
})

router.all("*", (req, res) => {
  res.status(404).send()
})

module.exports = router
