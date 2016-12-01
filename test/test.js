const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const test = require('ava')

const Shroud = require('../lib/index.js')
const Vault = require('../lib/vault')
const {DuplicateSecret, SecretNotFound} = require('../lib/error')

const TEST_MASTER_PASSWORD = 'verygoodA+password'
const TEST_SECRET_OBJ = {'sekrit.com': 'sekrit'}

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

test('add a secret to the vault', async t => {
  const shroud = init()
  t.notThrows(shroud.add(TEST_SECRET_OBJ))
})

test('get a secret from the vault', async t => {
  const shroud = init()
  const vault = Vault(shroud.dataDir)

  await shroud.add(TEST_SECRET_OBJ)

  const sealedSecretObj = vault.get('sekrit.com')
  const keys = ['sealedSecret', 'pubkey', 'salt']

  // check that the object has values set for all of the keys
  keys.forEach(key => t.truthy(sealedSecretObj[key]))
})

test('add a duplicate secret to the vault', async t => {
  const shroud = init()

  await shroud.add(TEST_SECRET_OBJ)
  const err = await t.throws(shroud.add(TEST_SECRET_OBJ))
  t.true(err instanceof DuplicateSecret)
})

test('get a non-existent secret from the vault', async t => {
  const shroud = init()

  const err = await t.throws(shroud.reveal('sekrit.com'))
  t.true(err instanceof SecretNotFound)
})

test('decrypt a secret', async t => {
  const shroud = init()
  await shroud.add(TEST_SECRET_OBJ)
  const decrypted = await shroud.reveal('sekrit.com')
  t.is(decrypted, TEST_SECRET_OBJ['sekrit.com'])
})
