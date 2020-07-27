// pending implementation for saving chats to both users database

const express = require("express");
const bodyParser = require("body-parser");
const socket = require("socket.io");
const fs = require("fs");
const http = require("http");
const https = require("https");
const mongoose = require("mongoose");
const User = require("../models/Users");
const corsMiddleware = require("./middlewares/cors");
const authRouter = require("./authRouter/authRouter");
const chatsRouter = require("./chatsRouter/chatsRouter");
const contactsRouter = require("./contactsRouter/contactsRouter");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const mediaRouter = require("./mediaRouter/mediaRouter");
const Messages = require("../models/Messages");
const authJWTKey = require("./secret/secret").authJWTKey;
const connectionString = require("./secret/secret").connectionString;
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

// let admin = new User({
//   _id: "5f1f45b0a0ced83a5d202e28",
//   name: 'admin',
//   email: 'admin@chatapp.com',
//   password: bcrypt.hashSync('4dm1n@d3v', saltRounds)
// });

// admin.save()
// .then(data=>{
//   console.log("saved admin data", data);
// })
// .catch(err=>{
//   console.log("could not save admin data",err);
// })

// let connectionString = "mongodb://127.0.0.1:27017/ChatApp";

//DB connection
mongoose
  .connect(connectionString, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    sslValidate: false
  })
  .catch((err) => {
    console.log("failed mongoose connect", err);
  });

mongoose.connection
  .once("open", (err) => {
    console.log("successfully connected to database");
  })
  .on("error", (err) => {
    console.log("error connecting to database", err);
  });
//App setup
const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use(authRouter);
app.use("/chats", chatsRouter);
app.use("/contacts", contactsRouter);
app.use("/media", mediaRouter);

// let options = {
//   key: fs.readFileSync(__dirname+'/selfsigned.key'),
//   cert: fs.readFileSync(__dirname+'/selfsigned.crt')
// }

// const server = https.createServer(options, app).listen(4000, ()=>{
//   console.log("Listening to request on port 4000");
// });

const server = app.listen(process.env.PORT || 4000, () => {
  console.log("Listening to request on port 4000");
});

//Static files
app.use(express.static("public"));

const addMessage = async (user, contact, msg, setUnread) => {
  let ct = user.contacts.find((item) => item.email === contact.email);
  if(!ct){
    return console.log("contact not found");
  }
  let messages = await Messages.findById(ct.messagesId);
  if(!messages)
    throw new Error("no msgs record found")
  // console.log("found msgs record", messages)
  // messages.messages = messages.messages || [];
  messages.messages.push(msg);
  if(setUnread){
    let ct = contact.contacts.find(item => item.email === user.email);
    if(ct){
      ct.unreadMessages = (ct.unreadMessages || 0) + 1;
    }
    contact.save();
  }
  messages.save();
};


const updateMessageInDatabase = async (from, to, msg) => {
  try {
    addMessage(from, to, msg, true);
    console.log("saved messages to db");
  } catch (err) {
    console.log("could not save msgs to db", err.message);
  }
};

const clearUnreadMessages = async (user, contactId) => {
  // update sender as well about read messages
  try{
    let contact = user.contacts.find((contact) => contact.userId === contactId);
    if (!contact) throw new Error("No sender found in user contact list");
    if (contact) {
      contact.unreadMessages = 0;
    user.save()
      let messages = await Messages.findById(contact.messagesId);
      if(!messages || !messages.messages || !messages.messages.length)
        return;
      for (let i = messages.messages.length - 1; i >= 0; i--) {
        let msg = messages.messages[i];
        if(!msg.seen && msg.from !== user.email){
          msg.seen = new Date();
        }
        else{
          break;
        }
      }
      messages.save();
    }
  }
  catch(err){
    console.log("error while clearing unread msgs", err.message);
  }
};

//socket setup
const io = socket(server);
io.on("connection", async (socket) => {
  let authData, user;
  try {
    authData = JSON.parse(socket.request._query.authData);
    if (!authData) {
      throw "invalid connection attempt";
    }
    authData = { ...authData, ...jwt.verify(authData.authToken, authJWTKey) };
    if (!authData || !authData.userId) throw "No valid auth data sent";
    user = await User.findById(authData.userId);
    user.currentSocketId = socket.id;
    user = await user.save();
  } catch (err) {
    console.log("connection error", err.message);
    return socket.disconnect();
  }
  console.log("made socket connection ", socket.id, authData.email);
  socket.on("joinRoom", (data) => {
    socket.join(data.groupName);
  });
  socket.on("sendMessageInGroup", (data) => {
    socket.broadcast.to(data.groupName).emit("message", {
      from: "server",
      msg: data.message,
      sent: new Date(),
    });
  });
  socket.on("sendPersonalMessage", async (data, ack) => {
    try {
      let contact = await User.findById(data.to);
      if (!data.to || !contact) throw new Error("No receiver found");
      let msgId = new mongoose.mongo.ObjectId();
      let newMessage = {
        from: authData.email,
        type: data.type,
        msg: data.msg,
        sent: new Date(),
        _id: msgId,
      };
      let delivered;
      console.log("addmessage", newMessage);
      if (
        contact.currentSocketId &&
        io.sockets.sockets[contact.currentSocketId]
      ) {
        io.sockets.sockets[contact.currentSocketId].emit(
          "receiveMessage",
          newMessage
        );
        delivered = new Date();
      }
      ack({
        _id: msgId,
        delivered
      });
      updateMessageInDatabase(user, contact, newMessage);
    } catch (err) {
      console.log("sending personal message failed", err.message, data);
    }
  });
  socket.on("clearUnreadMessages", async (data, sendAck) => {
    try {
      clearUnreadMessages(user, data.userId);
      sendAck("cleared unread messages");
      // update sender about messages read
      let contact = await User.findById(data.userId);
      console.log("clear unread messages of", contact.email);
      if(contact && contact.currentSocketId && io.sockets.sockets[contact.currentSocketId]){
        console.log("update sender about messages read")
        io.sockets.sockets[contact.currentSocketId].emit("msgsSeen", {
          userId: user._id,
          email: user.email,
          time: new Date()
        })
      }
    } catch (err) {
      sendAck("failed to clear unread messages");
      console.log("clearing unread message failed", err.message, data);
    }
  });
  socket.on("requestCall", async (callData, sendAck) => {
    try {
      if (!callData || !callData.userId) {
        throw new Error("no userId mentioned");
      }
      let contact = await User.findById(callData.userId);
      if (!contact) throw new Error("no user found");
      console.log("establish call b/w", user.name, contact.name)
      if (
        contact.currentSocketId &&
        io.sockets.sockets[contact.currentSocketId]
      ) {
        io.sockets.sockets[contact.currentSocketId].emit(
          "callInvitation",
          {
            user: user.userId,
            name: user.name,
            email: user.email,
            signalData: callData.signalData,
          },
          (ackData) => {
            console.log("call acknowledged", Boolean(ackData))
            sendAck(ackData);
          }
        );
      } else {
        console.log("user not online");
        sendAck(null);
      }
    } catch (err) {
      console.log("request call err", err.message);
    }
  });
});
