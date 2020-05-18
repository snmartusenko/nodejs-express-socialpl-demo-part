const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8').trim());
const axios = require('axios');
const requestPromise = require('request-promise');


module.exports.upload = async function (video, netId, token) {
    console.log("TCL: one video is uploading...")
    console.log("TCL: video", video)

    // Step 1 - get asset
    let getAssetHeaders = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
    };

    let getAssetData = {
        "registerUploadRequest": {
            "recipes": [
                "urn:li:digitalmediaRecipe:feedshare-video"
            ],
            "owner": `urn:li:person:${netId}`,
            "serviceRelationships": [{
                "relationshipType": "OWNER",
                "identifier": "urn:li:userGeneratedContent"
            }]
        }
    };

    let assetRes = await axios({
            method: 'post',
            url: 'https://api.linkedin.com/v2/assets?action=registerUpload',
            data: JSON.stringify(getAssetData),
            headers: getAssetHeaders,
        })
        .catch(err => {
            console.log('error of uploading linkedin video----------------------', err.response.data);
            return false;
        });

    console.log("getAssetHeaders", getAssetHeaders)

    if (assetRes == null || assetRes.data == null || assetRes.data.value == null) return false;

    let uploadUrl = assetRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    console.log("TCL: uploadUrl", uploadUrl)
    let asset = assetRes.data.value.asset;
    console.log("TCL: asset", asset)
    let headers = assetRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].headers;
    console.log("TCL: headers", headers)

    if (uploadUrl == null || asset == null || headers == null) return false;

    // Step 2 - upload video to asset
    let uploadedVideo = await requestPromise({
            method: 'put',
            url: uploadUrl,
            data: fs.createReadStream(video.path),
            headers: headers,
            resolveWithFullResponse: true,
        })
        .catch(err => {
            console.log("TCL: err.message", err.message)
            return false;
        });
    console.log("TCL: uploadedVideo.statusCode", uploadedVideo ? uploadedVideo.statusCode : undefined)

    if (uploadedVideo && uploadedVideo.statusCode == 200) {
        return asset;
    } else {
        return false;
    }
}