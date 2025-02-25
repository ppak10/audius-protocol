const crypto = require('crypto')
const config = require('../config')

const sign = (handle) => {
  const apiSecret = config.get('cognitoAPISecret')
  if (!apiSecret) throw new Error('Missing API Secret')

  const signer = crypto.createHmac('sha256', apiSecret)
  const result = signer.update(handle).digest()
  const base64 = Buffer.from(result).toString('base64')
  return base64
}

module.exports = {
  sign
}
