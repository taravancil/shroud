const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const test = require('ava')

const Shroud = require('../dist/index.js')
const Vault = require('../dist/vault')
const {DuplicateSecret, SecretNotFound} = require('../dist/error')

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

test('add a duplicate secret to the vault', async t => {
  const shroud = init()

  await shroud.add(TEST_SECRET_OBJ)
  const err = await t.throws(shroud.add(TEST_SECRET_OBJ))
  t.true(err instanceof DuplicateSecret)
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
  const sealedSecretObj = await shroud.add(TEST_SECRET_OBJ)
  const keys = ['sealedSecret', 'pubkey', 'salt']

  // check that the object has values set for all of the keys
  keys.forEach(key => t.truthy(sealedSecretObj[key]))
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
