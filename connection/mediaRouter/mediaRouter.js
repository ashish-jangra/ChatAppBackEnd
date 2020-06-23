const router = require("router");
const multer = require("multer");
const fs = require("fs");
const sharp = require('sharp');
const path = require("path");
const crypto = require("crypto");
const User = require("../../models/Users");
const authMiddleware = require("../middlewares/authMiddleware");
const mediaRouter = router();

mediaRouter.use(authMiddleware);

const imageStorage = multer.diskStorage({
  destination: "images",
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(16).toString('hex')+"."+file.extension);
  }
})

const imageUpload = storage => multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB
  },
  fileFilter: (req, file, cb) => {
    let {mimetype} = file;
    let fileExtension = mimetype.slice(mimetype.indexOf("/")+1);
    let allowedTypes = ['jpg', 'jpeg', 'png'];
    let isImage = mimetype.startsWith("image") && allowedTypes.includes(fileExtension);
    if(isImage){
      file.extension = fileExtension;
      return cb(null, true);
    }
    return cb(new Error('unknown file type'));
  }
})

const errorHandler = (err, req, res, next) => {
  res.status(400).json({
    err: true,
    message: err.message
  })
}

mediaRouter.post('/postImage', imageUpload(imageStorage).single('imageData'), (req,res)=>{
  console.log("request to post image", req.file);
  res.json({
    postedImage: true,
    filename: req.file.filename
  })
}, errorHandler)

mediaRouter.get('/getImage', (req,res)=>{
  console.log("request to get image",req.query)
  if(!req.query.filename){
    throw new Error('no filename mentioned')
  }
  let filePath = path.resolve(__dirname, "../images/"+req.query.filename);
  console.log("filepath", filePath);
  try{
    imgStream = fs.createReadStream(filePath);
    imgStream.on('open', ()=>{
      imgStream.pipe(res);
    })
    imgStream.on('error', (err)=> {
      console.log("cant read requested image", err.message)
    })
  }
  catch(err){
    console.log("error for fs", err.message)
  }
}, errorHandler)

const deleteImageFile = filename => {
  let filePath;
  filePath = path.resolve(__dirname, "../images/"+filename);
  fs.unlink(filePath, (err)=>{
    if(err){
      console.log('deletion error', err)
    }
    else{
      console.log('deleted image file')
    }
  });
}

mediaRouter.post('/updateProfilePic', imageUpload(imageStorage).single('profilePic'), async (req,res)=>{
  let user;
  try{
    let filename = req.file.filename;
    user = await User.findById(req.cookies.userId);
    if(!user)
      throw new Error('User not found!');
    deleteImageFile(user.profilePic);
    user.profilePic = filename;
    user = await user.save();
    res.json({
      msg: 'updated profile pic',
      filename
    })
  }
  catch(err){
    res.json({
      err: true,
      msg: err.message
    })
  }
}, errorHandler)

mediaRouter.get('/getProfilePic', async (req,res)=>{
  if(!req.query || !req.query.userId)
    throw new Error('no userId mentioned');
  let {userId} = req.query;
  try {
    let user = await User.findById(userId);
    if(!user)
      throw new Error('user not found');
    if(!user.profilePic)
      throw new Error();
    console.log("request to get profile pic of", user.name, "by", req.cookies.email);
    let filePath = path.resolve(__dirname, "../images/"+user.profilePic);
    let imgStream;
    if(req.query.width && req.query.height){
      imgStream = sharp(filePath).resize(128,128)
    }
    else{
      imgStream = fs.createReadStream(filePath);
    }
    imgStream.pipe(res)
  }
  catch(err){
    res.status('404').end(err.message || 'profile pic not found');
  }
}, errorHandler)

module.exports = mediaRouter;