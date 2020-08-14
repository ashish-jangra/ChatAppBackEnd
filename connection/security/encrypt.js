const crypto = require('crypto');

const encrypt = (text, key, iv) => {
  console.log({key,iv})
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return encrypted.toString('hex');
}

module.exports = encrypt;