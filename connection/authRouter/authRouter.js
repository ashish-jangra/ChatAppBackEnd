const router = require("router");
const authRouter = router();
const jwt = require("jsonwebtoken");
const User = require("../../models/Users");
const Messages = require("../../models/Messages");
const { resolve } = require("path");
const authJWTKey = require("../secret/secret").authJWTKey;
const saltRounds = 10;
const bcrypt = require('bcrypt');

authRouter.post("/login", (req, res) => {
  console.log("login request", req.body)
  let newMsg = {
    from: "admin@chatapp.com",
    msg: "Welcome to chat app"
  }
  User.findOne({ email: req.body.email })
    .then(async (data) => {
      if (!data) {
        console.log("user doesnt exist");
        let messages = new Messages();
        messages.messages = [newMsg];
        let {id: messagesId} = await messages.save();
        let user = new User({
          name: req.body.name,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, saltRounds),
          contacts: [
            {
              name: "admin",
              email: "admin@chatapp.com",
              userId: "5f1f45b0a0ced83a5d202e28",
              messagesId,
            },
          ],
        });
        data = await user.save();
        let admin = await User.findOne({
          email: "admin@chatapp.com"
        });
        admin.contacts = admin.contacts || [];
        admin.contacts.push({
          name: data.name,
          email: data.email,
          userId: data._id,
          messagesId,
        });
        await admin.save();
        console.log("added user", data);
      }
      else{
        if(!bcrypt.compareSync(req.body.password, data.password)){
          throw new Error("Invalid credentails");
        }
      }
      let cookieOptions = {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        expires: new Date().getTime() + 1000 * 60 * 60 * 24 * 365,
      };
      let authToken = jwt.sign({ userId: data._id }, authJWTKey, {
      });
      console.log("successful login");
      res.cookie("authToken", authToken, cookieOptions);
      res.cookie("userId", data._id.toString(), cookieOptions);
      res.cookie("name", data.name, cookieOptions);
      res.cookie("email", data.email, cookieOptions);
      res.json({
        isAuth: true,
        authData: {
          userId: data._id,
          name: data.name,
          email: data.email,
          authToken,
        },
      });
    })
    .catch((err) => {
      console.log("failed to login", err.message);
      res.json({
        isAuth: false,
        error: err.message,
      });
    });
});

authRouter.get("/verifyAuth", async (req, res) => {
  try {
    let tokenData = jwt.verify(req.cookies.authToken, authJWTKey);
    if (!tokenData || !tokenData.userId)
      throw Error("no userid present in token");
    let user = await User.findById(tokenData.userId);
    if (!user) {
      throw Error("invalid userId, no such user exists");
    }
    res.json({
      isAuth: true,
      authData: {
        userId: user._id,
        name: user.name,
        email: user.email,
        authToken: req.cookies.authToken,
      },
    });
  } catch (err) {
    res.json({
      isAuth: false,
      error: err.message,
    });
  }
});

module.exports = authRouter;
