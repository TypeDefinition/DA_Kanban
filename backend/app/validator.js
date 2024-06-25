module.exports.isValidUsername = (username) => {
  if (!username) return false
  if ("string" !== typeof username) return false

  // 4 to 32 characters, alphanumeric and underscore.
  const regex = /^[a-zA-Z0-9_]{4,32}$/
  return regex.test(username)
}

module.exports.isValidPassword = (password) => {
  if (!password) return false
  if ("string" !== typeof password) return false

  // 8 to 10 characters, letters and special characters.
  const regex = /^[a-zA-Z0-9!@#$%^&*()_+]{8,10}$/
  return regex.test(password)
}

module.exports.isValidEmail = (email) => {
  if (!email) return true // Allow empty email.

  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return "string" === typeof email && regex.test(email)
}

module.exports.isValidEnabled = (enabled) => {
  return "boolean" === typeof enabled
}

module.exports.isValidGroup = (group) => {
  if (!group) return false
  if ("string" !== typeof group) return false

  // 4 to 32 characters, letters and underscore.
  const regex = /^[a-zA-Z0-9_]{4,32}$/
  return regex.test(group)
}
