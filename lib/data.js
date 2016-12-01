#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

module.exports = Data

function Data (dataDir) {
  if (!(this instanceof Data)) return new Data(dataDir)

  this.file = path.join(dataDir, 'data')

  if (!fs.existsSync(this.file)) {
    fs.writeFileSync(this.file, JSON.stringify({}))
  }
}

// get the data object from the data file
Data.prototype.read = function () {
  try {
    const data = fs.readFileSync(this.file, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    throw err
  }
}

// get the value of a key in the data object
Data.prototype.get = function (key) {
  const data = this.read()
  return data[key] || undefined
}

// update a key or keys in the data object
Data.prototype.update = function (data) {
  const updated = Object.assign({}, this.read(), data)

  fs.writeFileSync(this.file, JSON.stringify(updated))
}
