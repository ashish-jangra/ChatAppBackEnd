const jwt = require('jsonwebtoken');
const authJWTKey = require('../secret').authJWTKey;

module.exports = function (req,res,next){
  try {
    let authData = jwt.verify(req.cookies.authToken, authJWTKey);
    if(req.cookies.userId !== authData.userId) throw "inconsistent cookies";
    next();
  }
  catch(err){
    console.log("auth error", err.message)
    res.json({
      isAuth: false,
      error: err.message
    })
  }
}