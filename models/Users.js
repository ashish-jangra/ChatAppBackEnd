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
    required: true,
  },
  userId: {
    type: String
  },
  about: String,
  messages: [[MessageSchema]],
  unreadMessages: {
    type: Number,
    default: 0
  }
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
  },
  profilePic: {
    type: String,
    default: ''
  }
})

const User = mongoose.model('User', UserSchema);

module.exports = User;