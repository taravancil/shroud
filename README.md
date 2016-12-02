# Shroud

[![standard code
style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

A module for encrypting and decrypting secrets with a master password, and
managing them in a file-based vault.

## Usage

```
const opts = {
  dataDir: '/usr/shroudData', // optional, default HOME_DIR/.shroud
  masterPassword: 'astrongmasterpassword' // required if not initialized
}

// initialize shroud
const shroud = require('shroud')(opts)

// add a secret to the vault
shroud.add({'sekrit.com': 'sekrit'})

// decrypt a secret
shroud.reveal('sekrit.com', 'astrongmasterpassword')

// remove a secret
shroud.remove('sekrit.com')
```
