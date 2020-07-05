const {Schema} = require('mongoose');

const MemberSchema = new Schema({
  email: {
    type: String
  }
});

const GroupMessages = new Schema({
  msg: String,
  seenBy: [MemberSchema],
  deliveredTo: [MemberSchema]
})

const GroupSchema = new Schema({
  name: {
    type: String
  },
  members: [MemberSchema],
  messages: [GroupMessages]
})

module.exports = GroupSchema;