# Change Log

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
