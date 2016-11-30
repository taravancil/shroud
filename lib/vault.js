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
    })

    fs.readFile(f, (err, data) => {
      if (err) throw err
      resolve(JSON.parse(data))
    })
  })
}

Vault.prototype.add = function (secretName, secretObj, category) {
  return new Promise((resolve, reject) => {
    const categoryDir = path.join(this.dataDir, category || '')
    const f = path.join(categoryDir, secretName)

    // check if the secret already exists
    fs.access(f, (err) => {
      if (!err) throw DuplicateSecret(secretName)
    })

    // make the category directory if it doesn't already exist
    if (category) {
      fs.access(categoryDir, (err) => {
        if (err) fs.mkdir(categoryDir)
      })
    }

    fs.writeFile(f, JSON.stringify(secretObj), (err) => {
      if (err) throw err
      resolve()
    })
  })
}

Vault.prototype.remove = function (secretName, category) {
  return new Promise((resolve, reject) => {
    const f = path.join(this.dataDir, category || '', secretName)

    // remove the secret file
    fs.unlink(f, (err) => {
      if (err) throw SecretNotFound(secretName)
      resolve()
    })
  })
}
