const express=require('express');
const socket=require('socket.io');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/Users');

// let admin = new User({
//   name: 'admin'
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

mongoose.connection.once('open', (err)=>{
  if(err){
    return console.log("error connecting to database",err);
  }
  console.log("successfully connected to database");
})

//App setup
const app=express();
const server=app.listen(4000,()=>{
	console.log("Listening to request on port 4000");
});

//Static files
app.use(express.static('public'));

//socket setup
const io=socket(server);
io.on('connection', (socket)=>{
  console.log('made socket connection ',socket.id);
  socket.on('joinRoom', (data)=>{
    socket.join(data.groupName);
  })
	socket.on('sendMessageInGroup', (data)=>{
    socket.broadcast.to(data.groupName).emit('message', {
      from: 'server',
      msg: data.message,
      time: '11:06AM'
    })
  })
});