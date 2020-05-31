const router = require('router');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../../models/Users');

const contactsRouter = router();

contactsRouter.use(authMiddleware);

contactsRouter.get('/getContacts', async (req,res)=>{
  try{
    let userId = req.cookies.userId;
    let user = await User.findById(userId);
    if(!user)
      throw "No user found"
    let contacts = user.contacts.map(contact=> {
      let recentMsgs = [];
      if(contact.messages && contact.messages.length){
        let lastMessageArray = contact.messages[contact.messages.length-1];
        recentMsgs = lastMessageArray.slice(Math.max(0, lastMessageArray.length-5));
      }
      return {email: contact.email, userId: contact.userId, name: contact.name, messages: recentMsgs};
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
    let contact = await User.findOne({email: req.body.email} ,'_id about');
    if(!user || !contact)
      throw "User not found"
    let newContact = {
      name: req.body.name,
      email: req.body.email,
      userId: contact._id,
      about: contact.about
    };
    user.contacts.push(newContact);
    await user.save();
    res.json({
      saved: true,
      contact: newContact
    })
  }
  catch(err){
    res.json({
      saved: false,
      error: err
    })
  }
})



module.exports = contactsRouter;