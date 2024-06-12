module.exports.isValidUsername = (input) => {
  if (!input) return false
  if ("string" !== typeof input) return false

  // 4 to 32 characters, alphanumeric and underscore.
  const regex = /^[a-zA-Z0-9_]{4,32}$/
  return regex.test(input)
}

module.exports.isValidPassword = (input) => {
  if (!input) return false
  if ("string" !== typeof input) return false

  // 8 to 10 characters, letters and special characters.
  const regex = /^[a-zA-Z0-9!@#$%^&*()_+]{8,10}$/
  return regex.test(input)
}

module.exports.isValidEmail = (input) => {
  if (!input) return true // Allow empty email.

  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return "string" === typeof input && regex.test(input)
}

module.exports.isValidEnabled = (input) => {
  return "boolean" === typeof input
}

module.exports.isValidGroup = (input) => {
  if (!input) return false
  if ("string" !== typeof input) return false

  // 4 to 32 characters, letters and underscore.
  const regex = /^[a-zA-Z0-9_]{4,32}$/
  return regex.test(input)
}

module.exports.isValidAppAcronym = (input) => {
  if (!input) return false
  if ("string" !== typeof input) return false

  // Only letters and underscore.
  const regex = /^[a-zA-Z0-9_]+$/
  return regex.test(input)
}

module.exports.isValidAppRNumber = (input) => {
  if (!input) return false
  if ("number" !== typeof input) return false
  return Number.isInteger(input) && 0 < input
}

module.exports.isValidAppDesc = (input) => {
  if (!input) return true
  return "string" === typeof input
}

module.exports.isValidDate = (input) => {
  if (!input) return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  return input.match(regex)
}

module.exports.isValidPlanName = (input) => {
  if (!input) return false
  return "string" === typeof input
}

module.exports.isValidTaskName = (input) => {
  if (!input) return false
  return "string" === typeof input
}

module.exports.isValidTaskDesc = (input) => {
  if (!input) return false
  return "string" === typeof input
}

module.exports.isValidNote = (input) => {
  if (!input) return false
  return "string" === typeof input
}
