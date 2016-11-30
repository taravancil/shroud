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
  return new Promise((resolve, reject) => {
    const f = path.join(this.dataDir, category || '', secretName)

    fs.open(f, 'r', (err, fd) => {
      if (err) {
        if (err.code === 'ENOENT') {
          throw SecretNotFound(secretName)
        } else {
          throw err
        }
      }

      resolve(fs.readFileSync(fd))
    })

    try {
      const sealedSecretObj = JSON.parse(fs.readFileSync(f))
      resolve(sealedSecretObj)
    } catch (err) {
      throw SecretNotFound(secretName)
    }
  })
}

Vault.prototype.add = function (secretName, secretObj, category) {
  return new Promise((resolve, reject) => {
    const f = path.join(this.dataDir, category || '', secretName)

    fs.open(f, 'wx', (err, fd) => {
      // throw if the secret already exists
      if (err) {
        if (err.code === 'EEXIST') {
          throw DuplicateSecret(secretName)
        } else {
          throw err
        }
      }

      fs.writeFileSync(fd, JSON.stringify(secretObj))
      resolve(secretObj)
    })
  })
}

Vault.prototype.remove = function (secretName, category) {
  return new Promise((resolve, reject) => {
    const f = path.join(this.dataDir, category || '', secretName)

    try {
      fs.unlinkSync(f)
    } catch (err) {
      throw SecretNotFound(secretName)
    }
  })
}
