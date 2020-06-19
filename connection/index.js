// pending implementation for saving chats to both users database

const express=require('express');
const bodyParser = require('body-parser');
const socket=require('socket.io');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/Users');
const corsMiddleware = require('./middlewares/cors');
const authRouter = require('./authRouter/authRouter');
const chatsRouter = require('./chatsRouter/chatsRouter');
const contactsRouter = require('./contactsRouter/contactsRouter');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mediaRouter = require('./mediaRouter/mediaRouter');
const authJWTKey = require('./secret').authJWTKey;

// let admin = new User({
//   name: 'admin',
//   email: 'admin@chatapp.com',
//   password: 'admin'
// });

// admin.save()
// .then(data=>{
//   console.log("saved admin data", data);
// })
// .catch(err=>{
//   console.log("could not save admin data",err);
// })

//DB connection
mongoose.connect('mongodb://127.0.0.1:27017/ChatApp', {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.catch(err=>{
  console.log("failed mongoose connect")
})

mongoose.connection.once('open', (err)=>{
  console.log("successfully connected to database");
})
.on('error', err => {
  console.log("error connecting to database");
})
//App setup
const app=express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use(authRouter);
app.use('/chats', chatsRouter);
app.use('/contacts', contactsRouter);
app.use('/media', mediaRouter);

const server=app.listen(4000,()=>{
	console.log("Listening to request on port 4000");
});

//Static files
app.use(express.static('public'));


const addMessage = (user, contact, msg, setUnread) => {
  let ct = user.contacts.find(item=> item.email === contact.email);
  if(!ct){
    console.log("could not find", contact.email,"in",user.contacts)
    user.contacts.push({
      name: contact.name,
      email: contact.email,
      userId: contact._id,
      about: contact.about,
      messages: [[msg]]
    })
  }
  else{
    if(setUnread)
      ct.unreadMessages = (ct.unreadMessages || 0) + 1;
    if(!ct.messages.length){
      ct.messages = [[msg]]
    }
    else{
      let lastMessageArray = ct.messages[ct.messages.length-1];
      if(lastMessageArray.length < 50)
        lastMessageArray.push(msg);
      else
        ct.messages.push([msg]);
    }
  }
}

const updateMessageInDatabase = async(from, to, msg)=>{
  try{
    to = await User.findById(to._id);
    from = await User.findById(from._id);
    to.unreadMessages = (to.unreadMessages || 0) + 1;
    addMessage(from, to, msg);
    addMessage(to, from, msg, true);
    from = await from.save();
    to = await to.save();
    console.log("saved messages to db");
  }
  catch(err){
    console.log("could not save msgs to db", err.message);
  }
}

const clearUnreadMessages = async (user, contactId) => {
  // update sender as well about read messages
  let contact = user.contacts.find(contact => contact.userId === contactId);
  if(!contact)
    throw new Error("No sender found in user contact list");
  if(contact){
    contact.unreadMessages = 0;
    let flag = true;
    for(let i=contact.messages.length-1;i>=0 && flag;i--){
      let messagesArray = contact.messages[i];
      for(let j=messagesArray.length-1;j>=0&&flag;j--){
        if(messagesArray[j].seen)
          flag = false;
        else{
          messagesArray[j].seen = new Date();
        }
      }
    }
    let data = await user.save();
    console.log("cleared unread messages of", contact.email, data.contacts.find(contact => contact.userId === contactId).unreadMessages)
  }
}

//socket setup
const io=socket(server);
io.on('connection', async (socket)=>{
  let authData, user;
  try{
    authData = JSON.parse(socket.request._query.authData);
    if(!authData){
      throw "invalid connection attempt";
    }
    authData = {...authData, ...jwt.verify(authData.authToken, authJWTKey)};
    if(!authData || !authData.userId)
      throw "No valid auth data sent";
    user = await User.findById(authData.userId);
    user.currentSocketId = socket.id;
    user = await user.save();
  }
  catch(err){
    console.log("connection error", err.message);
    return socket.disconnect();
  }
  console.log('made socket connection ',socket.id, authData.email);
  socket.on('joinRoom', (data)=>{
    socket.join(data.groupName);
  })
	socket.on('sendMessageInGroup', (data)=>{
    socket.broadcast.to(data.groupName).emit('message', {
      from: 'server',
      msg: data.message,
      sent: new Date()
    })
  })
  socket.on('sendPersonalMessage', async (data)=>{
    try{
      let contact = await User.findById(data.to);
      if(!data.to || !contact)
        throw "No receiver found";
      let newMessage = {
        from: authData.email,
        type: data.type,
        msg: data.msg,
        sent: new Date()
      };
      console.log("addmessage", newMessage);
      if(contact.currentSocketId && io.sockets.sockets[contact.currentSocketId]){
        io.sockets.sockets[contact.currentSocketId].emit('receiveMessage', newMessage);
      }
      updateMessageInDatabase(user, contact, newMessage);
    }
    catch(err){
      console.log("sending personal message failed", err.message, data);
    }
  })
  socket.on('clearUnreadMessages', data=>{
    console.log('clear unread messages of', data.userId)
    try{
      clearUnreadMessages(user, data.userId);
      // update sender about messages read
    }
    catch(err){
      console.log("sending personal message failed", err.message, data);
    }
  })
});