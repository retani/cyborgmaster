filename2key = function(filename) {
  return filename.replace(/\./g, "*")
}

key2filename = function(key) {
  return key.replace(/\*/g, ".")
}