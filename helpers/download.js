// Node.js module to save image from External URL
const fs = require('fs');
const request = require('request');
const https = require('https');
const path = require('path');


module.exports.fetchAndSaveImage = function (imageUrl, localPath) {
    localPath = path.normalize(localPath);
    console.log("TCL: module.exports.fetchAndSaveImage -> localPath", localPath)

    return new Promise((resolve, reject) => {
        request.get(imageUrl)
            .on('error', (err) => {
                console.error(err);
                reject(err);
            })
            .pipe(fs.createWriteStream(localPath))
            .on('finish', async () => {
                let fileInfo = path.parse(localPath);
                let localImage = {
                    originalname: fileInfo.base,
                    encoding: null,
                    mimetype: null,
                    destination: fileInfo.dir,
                    filename: fileInfo.base,
                    path: localPath,
                    size: fs.statSync(localPath).size,
                }
                resolve(localImage);
            });
    });
}


// let ext = require('path').extname(file.originalname);
//   ext = ext.length>1 ? ext : "." + require('mime').extension(file.mimetype);