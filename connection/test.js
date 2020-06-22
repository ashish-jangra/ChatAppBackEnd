const crypto = require('crypto');
const Cryptr = require('cryptr');
const lzutf8 = require('lzutf8');
const lzString = require('lz-string');

const hash = crypto.createHash('sha256');
const alice = crypto.getDiffieHellman('modp15');
const bob = crypto.getDiffieHellman('modp15');

// let i=0;
// while(i < 5){
//   console.log(alice.generateKeys().toString('hex'), '\n');
//   i++;
// }

alice.generateKeys();
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex')

const aliceCryptr = new Cryptr(aliceSecret);
const bobCryptr = new Cryptr(bobSecret);

let plainText = 'hello world we are testing encryptions with keys shared using diffie helman algorithms ';
hash.update(plainText);
let msgHash = hash.copy().digest('hex');

let start = new Date().getTime();

let encryptedMsg = aliceCryptr.encrypt(plainText);
// let compressedEncMsg = lzutf8.compress(encryptedMsg);

// let decompressedEncMsg = lzutf8.decompress(compressedEncMsg);
let decryptedMsg = bobCryptr.decrypt(encryptedMsg);
hash.update(decryptedMsg);
// let decryptedHash = hash.copy().digest('hex');

let hash1 = crypto.createHash('sha256');

hash1.update('ashish');
console.log("ashish: ", hash1.copy().digest('hex'));

hash1.update('jangra');
console.log("jangra: ", hash1.copy().digest('hex'));

hash1.update('ashish');
console.log("ashish: ", hash1.copy().digest('hex'));

hash1.update('jangra');
console.log("jangra: ", hash1.copy().digest('hex'));



// let hash2 = crypto.createHash('sha256');
// hash1.update(decryptedMsg);
// hash2.update(plainText);

// console.log(hash1.copy().digest('hex'))
// console.log(hash2.copy().digest('hex'))

// console.log(msgHash)
// console.log(hash.copy().digest('hex'))

// console.log(lzString,'\n','\n', encryptedMsg.length, lzString.compressToBase64(encryptedMsg).length)

// console.log(typeof encryptedMsg, encryptedMsg.length, lzutf8.compress(encryptedMsg, {outputEncoding: "Base64"}).length)

let end = new Date().getTime();

// console.log(decryptedMsg === plainText)
// console.log(plainText.length,'->',encryptedMsg.length,'->',compressedEncMsg.length, 'in', end-start+" ms")