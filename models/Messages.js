const {Schema, model} = require('mongoose');

const MsgSchema = new Schema({
  from: {
    type: String  //email
  },
  msg: String,
  type: String,
  sent: Date,
  delivered: Date,
  seen: Date
})

const MessagesSchema = new Schema({
  iv: String,
  key: String,
  messages: {
    type: [MsgSchema],
    default: []
  }
})

const Messages = model('Message', MessagesSchema);

module.exports = Messages;