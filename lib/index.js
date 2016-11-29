#!/usr/bin/env node
// native
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')

// external
const scrypt = require('scrypt')
const sodium = require('libsodium-wrappers')

const Data = require('./data')
const Vault = require('./vault')

module.exports = Shroud

function Shroud (opts) {
  if (!opts) throw new Error('Must specify a master password')
  if (!(this instanceof Shroud)) return new Shroud(opts)

  const dataDir = opts.dataDir || path.join(os.homedir(), '.shroud')

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
  }

  this.data = Data(dataDir)
  this.vault = Vault(dataDir)

  // if this is the first run, generate and store master keys and salts
  if (this.data.get('sealedMasterPrivKey') === undefined) {
    this.data.update(generateMasterKeyData(opts.masterPassword))
  }
}

Shroud.prototype.add = function (secretObj) {
  return new Promise((resolve, reject) => {
    const secretName = Object.keys(secretObj)[0]
    const secret = secretObj[secretName]

    // confirm that the secret.name doesn't already exist in the vault
    if (this.vault.get(secretName) !== undefined) {
      reject(`${secretName} already exists in the vault`)
    }

    const keyPair = sodium.crypto_box_keypair()
    const salt = crypto.randomBytes(sodium.crypto_box_NONCEBYTES)
    const masterPubKey = Buffer.from(this.data.get('masterPubKey'), 'base64')

    // encrypt the secret with the master public key and new private key
    const sealedSecret = sodium.crypto_box_seal(secret, masterPubKey)

    // add the secret to the vault
    this.vault.add(
      secretName,
      {
        sealedSecret: Buffer.from(sealedSecret).toString('base64'),
        pubkey: Buffer.from(keyPair.publicKey).toString('base64'),
        salt: salt.toString('base64')
      })

    resolve()
  })
}

Shroud.prototype.remove = function (name) {
  return new Promise((resolve, reject) => {
    if (this.vault.get(name) === undefined) {
      reject(`No secret for ${name} found`)
    }

    this.vault.remove(name)
    resolve()
  })
}

// Uses scrypt to hash the master password with a known salt to be
// used as the master key
function generateMasterKey (password, salt, len) {
  const scryptParams = scrypt.paramsSync(0.5)
  return scrypt.hashSync(password, scryptParams, len, salt)
}

function generateMasterKeyData (password) {
  const masterKeySalt = crypto.randomBytes(16)
  const masterKey = generateMasterKey(password,
                                      masterKeySalt,
                                      sodium.crypto_secretbox_KEYBYTES)

  const masterKeypair = sodium.crypto_box_keypair()

  // encrypt the master private key with scrypt hash of master password
  const {privateKey, publicKey} = masterKeypair
  const masterPrivKeySalt = crypto.randomBytes(sodium.crypto_secretbox_NONCEBYTES)
  const sealedMasterPrivKey = sodium.crypto_secretbox_easy(privateKey,
                                                           masterPrivKeySalt,
                                                           masterKey)

  return {
    masterKeySalt: masterKeySalt.toString('base64'),
    masterPrivKeySalt: masterPrivKeySalt.toString('base64'),
    sealedMasterPrivKey: Buffer.from(sealedMasterPrivKey).toString('base64'),
    masterPubKey: Buffer.from(publicKey).toString('base64')
  }
}
