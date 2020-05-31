const router = require('router');
const User = require('../../models/Users');
const authMiddleware = require('../middlewares/authMiddleware');

let chatsRouter = router();

chatsRouter.use(authMiddleware);

chatsRouter.get('/getChats', async (req,res)=>{
  console.log("request to get chats");
  
})

module.exports = chatsRouter;