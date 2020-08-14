const crypto = require('crypto');

const encrypt = (text, key, iv) => {
  console.log({key,iv})
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return encrypted.toString('hex');
}

const decrypt = (text, key, iv) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(Buffer.from(text, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString('ascii');
}

let start = new Date().getTime();

let key = crypto.randomBytes(32).toString('hex');
let iv = crypto.randomBytes(16).toString('hex');

// console.log(iv.length)

let encrypted = encrypt('hello world', key, iv);
console.log(encrypted);
console.log(decrypt(encrypted, key, iv))
let end = new Date().getTime();

console.log("time taken: ",(end-start)/1000)