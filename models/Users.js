const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MessageSchema = require('./MessageSchema');
const GroupSchema = require('./GroupSchema');

const ContactSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  messages: [MessageSchema]
})

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  about: {
    type: String
  },
  contacts: [ContactSchema],
  groups: [GroupSchema],
  currentSocketId: {
    type: String
  }
})

const User = mongoose.model('User', UserSchema);

module.exports = User;