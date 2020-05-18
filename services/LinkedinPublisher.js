const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8').trim());
const axios = require('axios');
const linkedinImageUploader = require('./LinkedinImageUploader');
const linkedinVideoUploader = require('./LinkedinVideoUploader');


module.exports.publish = async function (netId, token, secret, content) {
    console.log("TCL: linkedin is publishing...")
    let errors = [];
    if (typeof token != 'string') errors.push('token err');
    // if (typeof secret != 'string') errors.push('secret err');
    if (typeof content != 'object') errors.push('content err');
    if (!content.hasOwnProperty('message')) errors.push('message err');
    if (!content.hasOwnProperty('images')) errors.push('images err');
    if (!content.hasOwnProperty('videos')) errors.push('videos err');
    if (errors.length != 0) {
        console.log("TCL: module.exports.publish -> errors", errors)
        return {
            success: false,
            errors: errors,
        }
    }
    console.log("TCL: ---------------------");

    let headers = {
        'Authorization': 'Bearer ' + token,
        'X-Restli-Protocol-Version': '2.0.0',
    };
    let jsonBody = {
        "author": `urn:li:person:${netId}`,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": ""
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }

    // upload images if exist
    if (content.images.length != 0) {
        jsonBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
        if (jsonBody.specificContent['com.linkedin.ugc.ShareContent'].media == undefined) {
            jsonBody.specificContent['com.linkedin.ugc.ShareContent'].media = [];
        }

        for (let i = 0; i < content.images.length; i++) {
            // upload one image
            let uploadedImageSourceLink = await linkedinImageUploader.upload(content.images[i], netId, token)
                .catch(err => console.log(err));

            // add images to jsonBody
            if (uploadedImageSourceLink) {
                console.log("TCL: uploadedImageSourceLink", uploadedImageSourceLink)

                jsonBody.specificContent['com.linkedin.ugc.ShareContent'].media.push({
                    "status": "READY",
                    "description": {
                        "text": `description_${i}`
                    },
                    "media": uploadedImageSourceLink,
                    "title": {
                        "text": `title_${i}`
                    }
                });

            } else {
                errors.push('error of images uploading');
                return {
                    success: false,
                    errors: errors,
                }
            }
        }

    }

    // upload videos if exist
    if (content.videos.length != 0) {
        console.log("TCL: content.videos.length", content.videos.length)

        jsonBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'VIDEO';
        if (jsonBody.specificContent['com.linkedin.ugc.ShareContent'].media == undefined) {
            jsonBody.specificContent['com.linkedin.ugc.ShareContent'].media = [];
        }

        for (let i = 0; i < content.videos.length; i++) {
            // upload one video
            let uploadedVideoSourceLink = await linkedinVideoUploader.upload(content.videos[i], netId, token)
                .catch(err => console.log(err.message));

            // add video to jsonBody
            if (uploadedVideoSourceLink) {
                console.log("TCL: uploadedVideoSourceLink", uploadedVideoSourceLink)

                jsonBody.specificContent['com.linkedin.ugc.ShareContent'].media.push({
                    "status": "READY",
                    "description": {
                        "text": `video description_${i}`
                    },
                    "media": uploadedVideoSourceLink,
                    "title": {
                        "text": `video title_${i}`
                    }
                });

            } else {
                errors.push('error of videos uploading');
                return {
                    success: false,
                    errors: errors,
                }
            }
        }

    }

    // add message if exist
    if (content.message) {
        jsonBody.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text = content.message;
    }

    console.log("TCL: module.exports.publish -> jsonBody", JSON.stringify(jsonBody));

    // publish
    let sharedPost = await axios({
            method: 'post',
            url: 'https://api.linkedin.com/v2/ugcPosts',
            data: jsonBody,
            headers: headers,
        })
        .catch(err => {
            console.log("TCL: err when axios publish", err.message)
            errors.push(err.message);
        });

    console.log("TCL: sharedPost.data", sharedPost ? sharedPost.data : undefined)

    if (!errors || errors.length == 0) {
        console.log("TCL: module.exports.publish -> sharedPost true")
        return {
            success: true,
            publishedPostID: sharedPost.data.id,
            errors: null,
        }
    } else {
        return {
            success: false,
            errors: errors,
        }
    }
}