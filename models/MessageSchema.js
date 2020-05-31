const {Schema} = require('mongoose');

const MessageSchema = new Schema({
  from: {
    type: String  //email
  },
  msg: String,
  sent: Date,
  delivered: Date,
  seen: Date
})

module.exports = MessageSchema;