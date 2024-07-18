// Imports
const mysql = require("mysql2")

// Our database connection.
const db = mysql
  .createPool({
    host: `${process.env.DB_HOST}`,
    user: `${process.env.DB_USERNAME}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_NAME}`,
    connectionLimit: 16,
    timezone: "+00:00",
  })
  .promise()

module.exports = db
