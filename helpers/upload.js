const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    let folder = req.params.multerDestinationFolder;
    let localPath = path.normalize(__dirname + `/../uploads/${folder}`);
    fs.mkdirsSync(localPath);
    // console.log('folder', folder);
    // console.log('localPath', localPath);
    callback(null, localPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
});


// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, __dirname + '/../uploads/')
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '_' + file.originalname);
//   }

  // filename: function (req, file, cb) {
  //   var ext = require('path').extname(file.originalname);
  //   ext = ext.length>1 ? ext : "." + require('mime').extension(file.mimetype);
  //   require('crypto').pseudoRandomBytes(16, function (err, raw) {
  //     cb(null, (err ? undefined : raw.toString('hex') ) + ext);
  //   });
  // }

// });


const upload = multer({
  storage: storage
});

module.exports = upload;