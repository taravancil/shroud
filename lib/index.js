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

module.exports = Shroud

function Shroud (opts) {
  if (!opts) throw new Error('Must specify a master password')
  if (!(this instanceof Shroud)) return new Shroud(opts)

  const dataDir = opts.dataDir || path.join(os.homedir(), '.shroud')

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
  }

  this.data = Data(dataDir)

  // if this is the first run, generate and store master keys and salts
  if (this.data.get('sealedMasterPrivKey') === undefined) {
    this.data.update(generateMasterKeyData(opts.masterPassword))
  }
}

Shroud.prototype.add = function (secret) {
  // Generate a public/private keypair
  // Encrypt the secret with master public key and new private key
  // Store encrypted secret and public key in vault object

  // The vault is an Object where elements take the form
  // {'secretName': 'secret'}
}

Shroud.prototype.remove = function (name) {
  // Get the vault file, if the vault object has a key `name`,
  // remove it.
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
