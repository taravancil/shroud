const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const test = require('ava')

const Shroud = require('../lib/index.js')
const Vault = require('../lib/vault')
const {DuplicateSecret, SecretNotFound} = require('../lib/error')

const TEST_MASTER_PASSWORD = 'verygoodA+password'

function init () {
  // make a temp directory for each test's data files
  const tmpDir = path.join(__dirname, 'tmp', Math.random(8).toString(16))
  fs.mkdirSync(tmpDir)

  return Shroud({
    masterPassword: TEST_MASTER_PASSWORD,
    dataDir: tmpDir
  })
}

test.before(t => {
  fs.mkdirSync(path.join(__dirname, 'tmp'))
})

test.after.always(t => {
  fse.removeSync(path.join(__dirname, 'tmp'))
})

test('initialize shroud', async t => {
  const shroud = init()
  const data = shroud.data.read()
  const keys = [
    'masterKeySalt', 'masterPrivKeySalt', 'sealedMasterPrivKey', 'masterPubKey'
  ]

  // check that the object has values set for all of the keys
  keys.forEach(key => t.truthy(data[key]))
})

test('add a secret to the vault', t => {
  const shroud = init()
  t.notThrows(shroud.add('sekrit.com', null, 'sekrit'))
})

test('get a secret from the vault', async t => {
  const shroud = init()
  const vault = Vault(shroud.dataDir)

  await shroud.add('sekrit.com', null, 'sekrit')

  const sealedSecretObj = vault.get('sekrit.com')
  const keys = ['sealedSecret', 'pubkey', 'salt']

  // check that the object has values set for all of the keys
  keys.forEach(key => t.truthy(sealedSecretObj[key]))
})

test('get a non-existent secret from the vault', t => {
  const shroud = init()
  const vault = Vault(shroud.dataDir)

  const err = t.throws(() => vault.get('sekrit.com'))
  t.true(err instanceof SecretNotFound)
})

test('add a duplicate secret to the vault', async t => {
  const shroud = init()

  await shroud.add('sekrit.com', null, 'sekrit')
  const err = await t.throws(shroud.add('sekrit.com', null, 'sekrit'))
  t.true(err instanceof DuplicateSecret)
})

test('decrypt a secret', async t => {
  const shroud = init()
  await shroud.add('sekrit.com', null, 'sekrit')
  const decrypted = await shroud.reveal(TEST_MASTER_PASSWORD, 'sekrit.com')
  t.is(decrypted, 'sekrit')
})

test('list the secrets in the vault', async t => {
  const shroud = init()

  let secretNames = await shroud.list()
  t.is(0, secretNames.length)

  await shroud.add('sekrit.com', null, 'sekrit')

  secretNames = await shroud.list()
  t.is('sekrit.com', secretNames[0])
})

test('list categorized secrets in the vault', async t => {
  const shroud = init()

  // a secret with a category
  await shroud.add('sekrit.com', 'sekrits', 'sekrit')

  // list the secrets by category
  let secretNames = await shroud.list('sekrits')
  t.is(1, secretNames.length)
  t.is('sekrit.com', secretNames[0])
})

test('list secrets in the vault with a match pattern', async t => {
  const shroud = init()

  // add 2 secrets
  await shroud.add('sekrit.com', null, 'sekrit')
  await shroud.add('BuTTs.com', null, 'butts')

  const secretNames = await shroud.list(null, 'butts')
  t.is(1, secretNames.length)
  t.is(secretNames[0], 'BuTTs.com')
})
