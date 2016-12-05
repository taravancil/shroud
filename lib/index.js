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
const {MissingOption, InvalidPassword} = require('./error')

module.exports = Shroud

function Shroud (opts) {
  opts = opts || {}
  if (!(this instanceof Shroud)) return new Shroud(opts)

  this.masterPassword = opts.masterPassword
  this.dataDir = opts.dataDir || path.join(os.homedir(), '.shroud')

  if (!fs.existsSync(this.dataDir)) {
    fs.mkdirSync(this.dataDir)
  }

  this.data = Data(this.dataDir)
  this.vault = Vault(this.dataDir)

  // if this is the first run, generate and store master keys and salts
  if (this.data.get('sealedMasterPrivKey') === undefined) {
    if (!opts.masterPassword) throw MissingOption('masterPassword')
    this.data.update(generateMasterKeyData(this.masterPassword, opts.salt))
  }
}

Shroud.prototype.add = function (name, category, secret) {
  return new Promise((resolve, reject) => {
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

    this.vault.add(name, sealedSecretObj, category)
    resolve()
  })
}

Shroud.prototype.remove = function (secretName, category) {
  return new Promise((resolve, reject) => {
    this.vault.remove(secretName, category)
    resolve()
  })
}

Shroud.prototype.reveal = function (masterPassword, secretName, category) {
  return new Promise((resolve, reject) => {
    if (!masterPassword) throw Error('butts')

    const secret = this.vault.get(secretName, category)
    const masterKeySalt = Buffer.from(this.data.get('masterKeySalt'), 'base64')

    // generate the master key from the master password
    const masterKey = generateMasterKey(masterPassword,
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
      throw InvalidPassword()
    }

    try {
      // decrypt the secret
      const {sealedSecret} = secret
      const decryptedSecret = sodium.crypto_box_seal_open(
        Buffer.from(sealedSecret, 'base64'),
        Buffer.from(this.data.get('masterPubKey'), 'base64'),
        masterPrivKey
      )

      // return the secret as a string
      resolve(String.fromCharCode.apply(null, decryptedSecret))
    } catch (err) {
      throw err
    }
  })
}

Shroud.prototype.list = function (category, pattern) {
  return new Promise((resolve, reject) => {
    try {
      resolve(this.vault.list(category, pattern))
    } catch (err) {
      throw err
    }
  })
}

// Uses scrypt to hash the master password with a known salt to be
// used as the master key
function generateMasterKey (password, salt, len) {
  // TODO
  // paramsSync was giving bad output, so we'll just hardcode a good output for now
  // waiting on https://github.com/barrysteyn/node-scrypt/issues/145
  // -prf
  const scryptParams = { N: 16, r: 8, p: 1 } // scrypt.paramsSync(0.5)
  return scrypt.hashSync(password, scryptParams, len, salt)
}

function generateMasterKeyData (password, salt) {
  const masterKeySalt = salt || crypto.randomBytes(16)
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
