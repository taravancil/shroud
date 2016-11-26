#!/usr/bin/env node

module.exports = Shroud

function Shroud (config) {
  if (!(this instanceof Shroud)) return new Shroud(config)
  // if (!config) TODO

  // Derive the master key from config.masterPassword with scrypt

  // Generate a master/public privkey pair
  // Encrypt private key with master key
  // Store in config file
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
