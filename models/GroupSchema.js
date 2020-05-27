const {Schema} = require('mongoose');

const MemberSchema = new Schema({
  email: {
    type: String
  }
});

const GroupMessages = new Schema({
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