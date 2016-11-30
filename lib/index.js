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
const error = require('./error')

const {
  DuplicateSecret,
  MissingOption,
  SecretNotFound,
  InvalidPassword
} = error

module.exports = Shroud

function Shroud (opts) {
  if (!opts || !opts.masterPassword) throw new MissingOption('masterPassword')
  if (!(this instanceof Shroud)) return new Shroud(opts)

  this.masterPassword = opts.masterPassword

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
      reject(DuplicateSecret(secretName))
    }

    const keyPair = sodium.crypto_box_keypair()
    const salt = crypto.randomBytes(sodium.crypto_box_NONCEBYTES)
    const masterPubKey = Buffer.from(this.data.get('masterPubKey'), 'base64')

    // encrypt the secret with the master public key and new private key
    const sealedSecret = sodium.crypto_box_seal(secret, masterPubKey)

    // add the secret to the vault
    const sealedSecretObj = {
      sealedSecret: Buffer.from(sealedSecret).toString('base64'),
      pubkey: Buffer.from(keyPair.publicKey).toString('base64'),
      salt: salt.toString('base64')
    }

    this.vault.add(secretName, sealedSecretObj)
    resolve(sealedSecretObj)
  })
}

Shroud.prototype.remove = function (secretName) {
  return new Promise((resolve, reject) => {
    if (this.vault.get(secretName) === undefined) {
      reject(SecretNotFound(secretName))
    }

    this.vault.remove(secretName)
    resolve()
  })
}

Shroud.prototype.reveal = function (secretName) {
  return new Promise((resolve, reject) => {
    const secret = this.vault.get(secretName)

    if (secret === undefined) {
      reject(SecretNotFound(secretName))
    }

    // generate the master key from the master password
    const masterKeySalt = Buffer.from(this.data.get('masterKeySalt'), 'base64')
    const masterKey = generateMasterKey(this.masterPassword,
                                        masterKeySalt,
                                        sodium.crypto_secretbox_KEYBYTES)

    // decrypt the master private key with the master key derived from
    // the master password
    let masterPrivKey
    try {
      masterPrivKey = sodium.crypto_secretbox_open_easy(
        Buffer.from(this.data.get('sealedMasterPrivKey'), 'base64'),
        Buffer.from(this.data.get('masterPrivKeySalt'), 'base64'),
        masterKey
      )
    } catch (err) {
      reject(InvalidPassword())
    }

    // decrypt the sealed secret
    const {sealedSecret} = secret
    try {
      const decryptedSecret = sodium.crypto_box_seal_open(
        Buffer.from(sealedSecret, 'base64'),
        Buffer.from(this.data.get('masterPubKey'), 'base64'),
        masterPrivKey
      )
      resolve(String.fromCharCode.apply(null, decryptedSecret))
    } catch (err) {
      reject(err)
    }
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
