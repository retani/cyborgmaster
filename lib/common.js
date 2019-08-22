filename2key = function(filename) {
  return filename.replace(/\./g, "*")
}

key2filename = function(key) {
  return key.replace(/\*/g, ".")
}

getGlobalValue = function(name) {
  var obj = Globals.findOne({name})
  var val = obj ? obj.value : undefined
  return val
}