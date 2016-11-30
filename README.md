# Shroud

[![standard code
style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

A module for encrypting and decrypting secrets with a master password, and
managing them in a file-based vault.

## Usage

```
const config = {
  dataDir: '/usr/shroudData', // optional, default HOME_DIR/.shroud
  masterPassword: 'astrongmasterpassword' // required
}

// initialize shroud
const shroud = require('shroud')(config)

// add a secret to the vault
shroud.add({'sekrit.com': 'sekrit'})

// decrypt a secret
shroud.reveal('sekrit.com')

// remove a secret
shroud.remove('sekrit.com')
```
