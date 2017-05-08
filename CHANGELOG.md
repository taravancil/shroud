# Change Log

## 0.6.2 -- 2017-04-22

### Changed

* `Shroud.update` now takes an object with required properties `name` and
  `secret`, and optional property `category`
* `Shroud.remove` now takes an object with required property `name` and optional
  property `category`

### Fixed

## 0.6.1 -- 2017-04-22

### Changed

Updated README

## 0.6.0 -- 2017-04-22

### Fixed

* Trying to list by a non existent category now throws an error.

### Changed

* `Shroud.add` now accepts an object with required properties `name` and
  `secret`, and the optional property `category`
* `Shroud.list` now optionally accepts an object with the optional
  properties `pattern` and `category`

## 0.5.0 -- 2017-01-08

### Fixed

* `Shroud.list` properly filters categorized secrets by a match pattern

### Changed

* `Shroud.list` now returns an object with at least one property `uncategorized`
  and other properties that are category names

## 0.4.0 -- 2017-01-01

### Added

* Added `Shroud.update` to update an existing secret

### Fixed

* `Shroud.reveal` passes the category param to `Vault.get`
* `Shroud.list` properly lists categorized secrets

### Changed

* Encrypting and decrypting secrets now happens with `crypto_box`, libsodium's
  interface for doing authenticated encryption.

## 0.3.0 -- 2016-12-04

### Changed

* `Shroud.add` now takes the params `[name, category, secret]` instead of a
  secret Object

## 0.2.0 -- 2016-12-02

### Added

* `Shroud.list` returns a list of the secret names in the vault, filtered by
  category, pattern, or not at all

## 0.1.3 -- 2016-12-01

### Changed

* `opts.masterPassword` is now only required when initializing `Shroud`
* `Shroud.reveal` now requires a `masterPassword` parameter

## 0.1.2 - 2016-11-30

### Added

* This CHANGELOG file
* `Shroud.add` now accepts a category param for organizing secrets by category
* Set up Travis CI build

### Changed

* The data for each secret is now stored an individual file instead of one
  vault file

### Fixed

* `Data` and `Vault` now handle edge cases like failed `JSON.parse`s,
  reading non-existent files, etc.
* Tmpfix for a bug where `scrypt` occasionally generated invalid
  scryptParams by [hardcoding the values](https://github.com/taravancil/shroud/pull/1)

## 0.1.1 - 2016-11-29

### Fixed

* `throw` Errors instead of rejecting within Promises
