# Shroud

[!standard code style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)

## Example

```
const config = {
  dataFile: '/usr/shroudData', // default HOME_DIR/.shroud/data
  vaultFile: '/usr/shroudVault', // default HOME_DIR/.shroud/vault
  masterPassword: 'astrongmasterpassword'
}

const shroud = require('shroud')(config)

const github = {'github': 'a password'}

shroud.add(github)

const newGithub = {'github': 'a new password'}

shroud.update(newGithub)
shroud.remove('github')
```
