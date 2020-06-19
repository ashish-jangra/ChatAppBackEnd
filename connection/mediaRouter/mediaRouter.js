const router = require("router");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middlewares/authMiddleware");
const mediaRouter = router();

mediaRouter.use(authMiddleware);

const upload = multer({
  dest: 'images',
  limits: {
    fileSize: 10 * 1000000
  }
})

const errorHandler = (err, req, res, next) => {
  res.status(400).json({
    err: true,
    message: err.message
  })
}

mediaRouter.post('/postImage', upload.single('imageData'), (req,res)=>{
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

module.exports = mediaRouter;