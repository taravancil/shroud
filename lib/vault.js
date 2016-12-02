#!/usr/bin/env node
// native
const fs = require('fs')
const path = require('path')

const {DuplicateSecret, SecretNotFound} = require('./error')

module.exports = Vault

function Vault (dataDir) {
  if (!(this instanceof Vault)) return new Vault(dataDir)

  this.dataDir = dataDir
}

// get the value the secret `secretName` in `category`
Vault.prototype.get = function (secretName, category) {
  const f = path.join(this.dataDir, category || '', secretName)

  if (!fs.existsSync(f)) throw SecretNotFound(secretName)

  try {
    const secret = JSON.parse(fs.readFileSync(f))
    return secret
  } catch (err) {
    throw err
  }
}

// return a list of secret names in category/the whole vault
Vault.prototype.list = function (category) {
  const f = path.join(this.dataDir, category || '')
  const secretFiles = fs.readdirSync(f)

  // don't include the shroud data file
  return secretFiles.filter(f => f !== 'data')
}

Vault.prototype.add = function (secretName, secretObj, category) {
  const categoryDir = path.join(this.dataDir, category || '')
  const f = path.join(categoryDir, secretName)

  // check if the secret already exists
  if (fs.existsSync(f)) throw DuplicateSecret(secretName)

  // make the category directory if it doesn't already exist
  if (category) {
    try {
      fs.accessSync(categoryDir)
    } catch (_) {
      fs.mkdirSync(categoryDir)
    }
  }

  fs.writeFileSync(f, JSON.stringify(secretObj))
}

Vault.prototype.remove = function (secretName, category) {
  const f = path.join(this.dataDir, category || '', secretName)

  // remove the secret file
  try {
    fs.unlinkSync(f)
  } catch (_) {
    throw SecretNotFound(secretName)
  }
}
