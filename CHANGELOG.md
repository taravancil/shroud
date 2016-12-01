# Change Log

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
