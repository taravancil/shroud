const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const test = require('ava')

const Shroud = require('../lib/index.js')
const Vault = require('../lib/vault')
const {DuplicateSecret, SecretNotFound, CategoryNotFound} = require('../lib/error')

const TEST_MASTER_PASSWORD = 'verygoodA+password'
const TEST_SECRET = {name: 'sekrit.com', secret: 'sekrit'}
const TEST_SECRET_CATEGORIZED = Object.assign({category: 'sekrits'}, TEST_SECRET)

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
  t.notThrows(shroud.add(TEST_SECRET))
})

test('get a secret from the vault', async t => {
  const shroud = init()
  const vault = Vault(shroud.dataDir)

  await shroud.add(TEST_SECRET)

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

  await shroud.add(TEST_SECRET)
  const err = await t.throws(shroud.add(TEST_SECRET))
  t.true(err instanceof DuplicateSecret)
})

test('decrypt a secret', async t => {
  const shroud = init()
  await shroud.add(TEST_SECRET)
  const decrypted = await shroud.reveal(TEST_MASTER_PASSWORD, 'sekrit.com')
  t.is(decrypted, 'sekrit')
})

test('list the secrets in the vault', async t => {
  const shroud = init()

  let secretNames = await shroud.list()
  t.is(0, secretNames['uncategorized'].length)

  await shroud.add(TEST_SECRET)

  secretNames = await shroud.list()
  t.true(secretNames['uncategorized'].includes('sekrit.com'))
})

test('list categorized secrets in the vault', async t => {
  const shroud = init()
  await shroud.add(TEST_SECRET_CATEGORIZED)

  // list the secrets by category
  let secretNames = await shroud.list({category: 'sekrits'})
  t.is(1, secretNames['sekrits'].length)
  t.deepEqual({sekrits: [TEST_SECRET_CATEGORIZED.name]}, secretNames)
})

test('list secrets in the vault with a match pattern', async t => {
  const shroud = init()

  // add 2 secrets that will match 'butts' filter
  await shroud.add({name: 'BuTTs.com', category: 'butts', secret: 'butts'})
  await shroud.add({name: 'BuTTs.com', secret: 'butts'})
  await shroud.add({name: 'booty.com', category: 'booties', secret: 'booty'})

  const secretNames = await shroud.list({pattern: 'butts'})
  t.true(secretNames['uncategorized'].includes('BuTTs.com'))
  t.true(secretNames['butts'].includes('BuTTs.com'))
  t.false('booties' in secretNames)
})

test('list a non-existent category', async t => {
  const shroud = init()

  const err = await t.throws(shroud.list({category: 'notfound'}))
  t.true(err instanceof CategoryNotFound)
})

test('update an existing secret', async t => {
  const shroud = init()

  // add the secret
  await shroud.add(TEST_SECRET)

  //  the secret
  await shroud.update({name: 'sekrit.com', secret: 'newSekrit'})

  const decrypted = await shroud.reveal(TEST_MASTER_PASSWORD, 'sekrit.com')
  t.is(decrypted, 'newSekrit')
})

test('remove a secret', async t => {
  const shroud = init()

  await shroud.add(TEST_SECRET)
  await shroud.remove(TEST_SECRET)

  t.deepEqual({uncategorized: []}, await shroud.list())
})

test('remove a categorized secret', async t => {
  const shroud = init()

  await shroud.add(TEST_SECRET_CATEGORIZED)
  await shroud.remove(TEST_SECRET_CATEGORIZED)

  t.deepEqual({uncategorized: []}, await shroud.list())
})

test('delete a category directory after removing the last secret in that category', async t => {
  const shroud = init()

  // add a categorized secret
  await shroud.add(TEST_SECRET_CATEGORIZED)
  await shroud.remove(TEST_SECRET_CATEGORIZED)

  t.false(TEST_SECRET_CATEGORIZED.category in await shroud.list())
})

test('should not be able to add a secret with forbidden characters in name', async t => {
  const shroud = init()

  await shroud.add({name: '/badname', secret: 'test'})
  const secrets = await shroud.list()
  t.is(secrets.uncategorized[0], 'badname')
})
