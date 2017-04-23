const zerr = require('zerr')

exports.MissingOption = zerr('MissingOption', 'opts.% is required')
exports.DuplicateSecret = zerr('DuplicateSecret', 'A secret for % already exists')
exports.SecretNotFound = zerr('SecretNotFound', 'No secret found for %.')
exports.InvalidPassword = zerr('InvalidPassword', 'Invalid master password')
exports.MissingSecret = zerr('MissingSecret', 'Shroud.add requires a secret')
exports.MissingName = zerr('MissingName', 'Shroud.add requires a name')
exports.CategoryNotFound = zerr('CategoryNotFound', 'Category % not found')
