const crypto = require('crypto');

const decrypt = (text, key, iv) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(Buffer.from(text, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString('ascii');
}

module.exports = decrypt;