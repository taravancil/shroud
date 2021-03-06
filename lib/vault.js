#!/usr/bin/env node
// native
const fs = require('fs')
const path = require('path')

const {DuplicateSecret, SecretNotFound, CategoryNotFound} = require('./error')

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
Vault.prototype.list = function (category, pattern) {
  // get path to either the category's directory or top-level shroud directory
  const dir = path.join(this.dataDir, category || '')

  // get the names of the files and directories in the directory
  let filenames
  try {
    filenames = fs.readdirSync(dir)
  } catch (_) {
    throw CategoryNotFound(category)
  }

  // don't include the shroud data file if in top-level .shroud directory
  if (!category) {
    filenames.splice(filenames.indexOf('data'), 1)
  }

  let secrets = {}

  if (category) {
    secrets[category] = filenames
  } else {
    secrets.uncategorized = []

    // get full paths
    const paths = filenames.map(f => path.join(dir, f))

    paths.forEach(p => {
      // get the name of the secret
      const name = path.basename(p)

      // the path is a category directory
      // traverse the category and add a new object for the category to secrets
      if (isDirectory(p)) {
        let categorySecrets = fs.readdirSync(p)

        categorySecrets = categorySecrets.map(s => path.basename(s))
        secrets[name] = categorySecrets
      } else {
        secrets['uncategorized'].push(name)
      }
    })
  }

  // filter secrets on match pattern
  if (pattern) {
    // ignore case
    const regex = new RegExp(pattern, 'i')

    for (const category in secrets) {
      secrets[category] = secrets[category].filter(f => f.match(regex))

      // if the category doesn't have any secrets that match, remove it from
      // the results
      if (!secrets[category].length) {
        delete secrets[category]
      }
    }
  }

  return secrets
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

  // if we remove the last secret in a category secret, delete the category dir
  if (category && !fs.readdirSync(categoryPath).length) {
    fs.rmdirSync(categoryPath)
  }
}

Vault.prototype.update = function (secretName, secretObj, category) {
  const f = path.join(this.dataDir, category || '', secretName)

  try {
    fs.writeFileSync(f, JSON.stringify(secretObj))
  } catch (_) {
    throw SecretNotFound(secretName)
  }
}

function isDirectory (f) {
  return fs.statSync(f).isDirectory()
}

