#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

module.exports = Vault

function Vault (dataDir) {
  if (!(this instanceof Vault)) return new Vault(dataDir)

  this.file = path.join(dataDir, 'vault')

  if (!fs.existsSync(this.file)) {
    fs.writeFileSync(this.file, JSON.stringify({}))
  }
}

// get the data object from the vault file
Vault.prototype.read = function () {
  const vault = fs.readFileSync(this.file, 'utf8')
  return JSON.parse(vault)
}

// get the value of the key `name` in the vault object
Vault.prototype.get = function (name) {
  const vault = this.read()
  return vault[name]
}

Vault.prototype.add = function (secretName, secretObj) {
  let vault = this.read()
  vault[secretName] = secretObj // TODO
  fs.writeFileSync(this.file, JSON.stringify(vault, null, 2))
}

Vault.prototype.remove = function (secretName) {
  let vault = this.read()
  delete vault[secretName]
  fs.writeFileSync(this.file, JSON.stringify(vault, null, 2))
}
