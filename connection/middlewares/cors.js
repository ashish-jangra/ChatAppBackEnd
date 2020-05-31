const whiteList = [undefined, 'http://localhost:3000', 'http://192.168.43.11:3000', 'https://localhost:3000', 'https://192.168.43.11:3000'];

module.exports = function(req,res,next){
  let origin = req.headers.origin;
  if(whiteList.includes(origin)){
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  }
  else{
    res.json({
      origin,
      allowCORS: false
    })
  }
}