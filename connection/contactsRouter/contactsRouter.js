const router = require('router');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../../models/Users');
const Messages = require('../../models/Messages');

const contactsRouter = router();

contactsRouter.use(authMiddleware);

let sortByRecentMsg = (ct1, ct2) => {
  // let lastMsgArr1 = ct1.messages[ct1.messages.length-1], lastMsgArr2 = ct2.messages[ct2.messages.length-1];
  // let lastMsg1 = lastMsgArr1[lastMsgArr1.length-1], lastMsg2 = lastMsgArr2[lastMsgArr2.length-1];
  let lastMsg1 = ct1.lastMessage, lastMsg2 = ct2.lastMessage;
  if(!lastMsg1)
    return 1;
  if(!lastMsg2)
    return -1;
  if(lastMsg1.sent < lastMsg2.sent)
    return -1;
  if(lastMsg1.sent > lastMsg2.sent)
    return 1;
  return ct1.name <= ct2.name ? -1 : 1;
}

contactsRouter.get('/getContacts', async (req,res)=>{
  try{
    let userId = req.cookies.userId;
    let user = await User.findById(userId);
    if(!user)
      throw "No user found";
    // make sure total msgs length doesnt exceed beyond limit
    let {contacts} = user;
    // contacts.sort(sortByRecentMsg);
    // contacts = contacts.slice(0,10);
    // contacts = contacts.map(contact=> {
    //   let recentMsgs = [];
    //   if(contact.messages && contact.messages.length){
    //     let lastMessageArray = contact.messages[contact.messages.length-1];
    //     recentMsgs = lastMessageArray.slice(Math.max(0, lastMessageArray.length-5));
    //   }
    //   return {email: contact.email, userId: contact.userId, name: contact.name, messages: recentMsgs, unreadMessages: contact.unreadMessages};
    // })
    let recentContacts = [];
    for(let i=0; i<contacts.length; i++){
      let contact = contacts[i];
      let messages = await Messages.findById(contact.messagesId) || {messages: []};
      messages = messages.messages.slice(-5);
      recentContacts.push({
        email: contact.email,
        userId: contact.userId,
        name: contact.name,
        messages,
        lastMessage: messages[messages.length-1] || undefined,
        unreadMessages: contact.unreadMessages
      })
    }
    recentContacts.sort(sortByRecentMsg);
    // console.log("contacts", contacts);
    res.json({
      contacts: recentContacts
    })
  }
  catch(err){
    console.log("[contactsRouter] /getcontacts", err.message)
    res.json({
      error: err,
      contacts: []
    })
  }
})

contactsRouter.get('/getContactsList', async (req,res)=>{
  try{
    let userId = req.cookies.userId;
    let user = await User.findById(userId);
    if(!user)
      throw "User not found"
    let contacts = user.contacts.map(contact=> {
      return {email: contact.email, userId: contact.userId, name: contact.name, about: contact.about};
    })
    // console.log("contacts", contacts);
    res.json({
      contacts
    })
  }
  catch(err){
    res.json({
      error: err,
      contacts: []
    })
  }
})

contactsRouter.post('/addContact', async (req,res)=>{
  console.log("addcontact", req.body)
  try{
    let userId = req.cookies.userId;
    let user = await User.findById(userId);
    let contact = await User.findOne({email: req.body.email} ,'_id about contacts');
    if(!user || !contact)
      throw "User not found";
    if(user.contacts.find(ct => ct.email === contact.email))
      throw new Error("contact already exists");
    let messages = new Messages();
    messages.messages = [];
    messages = await messages.save();
    let newContact = {
      name: req.body.name,
      email: req.body.email,
      userId: contact._id,
      about: contact.about,
      messagesId: messages._id
    };
    user.contacts.push(newContact);
    console.log("added to user contact list");
    console.log("contact: ", contact)
    contact.contacts.push({
      name: user.name,
      email: user.email,
      userId: user._id,
      about: user.about,
      messagesId: messages._id
    })
    console.log("added to other user contact list")
    await user.save();
    await contact.save();
    res.json({
      saved: true,
      contact: newContact
    })
  }
  catch(err){
    res.json({
      saved: false,
      error: err.message
    })
  }
})

contactsRouter.get('/contactInfo', async (req,res)=>{
  try{
    if(!req.query || !req.query.userId)
      throw new Error('no userId mentioned')
    let user = await User.findById(req.query.userId);
    if(!user)
      throw new Error('no user found');
    res.json({
      name: user.name,
      about: user.about,
      email: user.email
    })
  }
  catch(err){
    res.status(404).json({
      error: true,
      message: err.message
    })
  }
})


module.exports = contactsRouter;