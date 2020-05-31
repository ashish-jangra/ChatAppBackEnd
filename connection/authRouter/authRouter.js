const router = require('router');
const authRouter = router();
const jwt = require('jsonwebtoken');
const User = require('../../models/Users');
const authJWTKey = require('../secret').authJWTKey;

authRouter.post('/login', (req,res)=>{
  User.findOne({email: req.body.email, password: req.body.password})
    .then(async data => {
      if(!data){
        console.log("user doesnt exist")
        let user = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          contacts: [{
            name: "admin",
            email: "admin@chatapp.com",
            userId: "5ed3bb660f516f26ba4582b3",
            messages: [[{
              from: "admin@chatapp.com",
              msg: "Welcome to chat app"
            }]]
          }]
        })
        data = await user.save();
        let admin = await User.findOne({name: 'admin', email: 'admin@chatapp.com', password: 'admin'});
        admin.contacts = admin.contacts || [];
        admin.contacts.push({
          name: data.name,
          email: data.email,
          userId: data._id,
          messages: [[{
            from: 'admin@chatapp.com',
            msg: 'Welcome to chat app'
          }]]
        })
        await admin.save();
        console.log("added user", data);
      }
      let cookieOptions = {
        maxAge: 1000*60*60*24,
        expires: false
      }
      let authToken = jwt.sign({ userId: data._id}, authJWTKey, {expiresIn: '1 day'});
      res.cookie('authToken', authToken, cookieOptions);
      res.cookie('userId', data._id.toString(), cookieOptions);
      res.cookie('name', data.name, cookieOptions);
      res.cookie('email', data.email, cookieOptions);
      res.json({
        isAuth: true,
        authData: {
          userId: data._id,
          name: data.name,
          email: data.email,
          authToken
        }
      })
    })
    .catch(err => {
      console.log("failed to save user data", err.message)
      res.json({
        isAuth: false,
        error: err
      })
    })
})

authRouter.get('/verifyAuth', (req,res)=> {
  try {
    let tokenData = jwt.verify(req.cookies.authToken);
    res.json({
      isAuth: true
    })
  }
  catch(err){
    res.json({
      isAuth: false,
      error: err
    })
  }
})

module.exports = authRouter;