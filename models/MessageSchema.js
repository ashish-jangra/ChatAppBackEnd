const {Schema} = require('mongoose');

const MessageSchema = new Schema({
  from: {
    type: String  //email
  },
  to: {
    type: String //email
  },
  read: Date,
  seen: Date
})

module.exports = MessageSchema;