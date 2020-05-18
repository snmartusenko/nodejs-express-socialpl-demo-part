const SocialNets = require('../models/SocialNets');
const SchedulePosts = require('../models/SchedulePosts');
const UserActivity = require('../models/UserActivity');
const twitterPublisher = require('./TwitterPublisher');
// const facebookPublisher = require('./FacebookPublisher');
const facebookPagePublisher = require('./FacebookPagePublisher');
// const tumblrPublisher = require('./InstagramPublisher');
const linkedinPublisher = require('./LinkedinPublisher');
const instagramPublisher = require('./InstagramPublisher');


module.exports.postNow = async function (scheduledPost) {
    console.log("TCL: try to publish scheduledPost.id", scheduledPost.id);
    if (!scheduledPost instanceof SchedulePosts) return false;
    let errors = {};
    let countErr = 0;
    if (!scheduledPost.nets || scheduledPost.nets.length == 0) {
        countErr++;
        errors.general = 'no nets';
    }
    let content = {
        message: scheduledPost.message,
        images: scheduledPost.images,
        videos: scheduledPost.videos,
    }
    for (net of scheduledPost.nets) {
        if (!errors[net.netName]) {
            errors[net.netName] = {};
        };
        let publishedPostID = await publishOneNet(scheduledPost, net, content)
            .catch((err) => {
                countErr++;
                // set errors in sheduledPost model
                scheduledPost.setPublishStatusForNetNameAndId(net.netName, net.netId, 'errors');
                scheduledPost.setPublishErrorsForNetNameAndId(net.netName, net.netId, err);

                // log
                UserActivity.logPublishErrorOfSocialNetScheduledPost(scheduledPost, net);

                // collect errors for response
                errors[net.netName][net.netId] = {
                    success: false,
                    errors: err,
                }
            });
        console.log("TCL: publishedPostID", publishedPostID)
        if (publishedPostID) {
            // set errors in sheduledPost model
            await scheduledPost.setPublishedPostIDForNetNameAndId(net.netName, net.netId, publishedPostID);
            await scheduledPost.setPublishStatusForNetNameAndId(net.netName, net.netId, 'published');
            await scheduledPost.setPublishErrorsForNetNameAndId(net.netName, net.netId, null);

            // log
            UserActivity.logScheduledPostSocialNetPublishing(scheduledPost, net);
        }
    }

    scheduledPost.publishTime = new Date();

    if (countErr == 0) {
        // set 'published' publishStatus
        console.log("TCL: published")
        scheduledPost.publishStatus = 'published';
        await scheduledPost.save();

        return {
            success: true,
            publishedPost: scheduledPost,
            errors: null,
        }
    } else {
        // set 'errors' publishStatus
        console.log("TCL: errors", typeof errors, errors)
        scheduledPost.publishStatus = 'errors';
        await scheduledPost.save();

        return {
            success: false,
            errors: errors,
        }
    }
}


async function publishOneNet(scheduledPost, net, content) {
    return new Promise(async (resolve, reject) => {
        console.log("TCL: try to publish one social net ..........", net.netName, net.netId);

        // check if social net already posted
        let alreadyPublishedPostID = await scheduledPost.getPostedIDForNetNameAndId(net.netName, net.netId);
        console.log("TCL: publishOneNet -> alreadyPublishedPostID", alreadyPublishedPostID)
        if (alreadyPublishedPostID != null) {
            resolve(alreadyPublishedPostID);
        }

        let socialNetsModel = await SocialNets.findOne({
            userID: scheduledPost.userID,
            [net.netName]: {
                $elemMatch: {
                    id: net.netId,
                }
            }
        }).catch((err) => {
            console.log("TCL: await SocialNets.findOne err", err)
            reject('can`t find social net');
        });

        if (socialNetsModel) {
            // get tokens
            let keys = await socialNetsModel.getTokensByNetNameAndId(net.netName, net.netId);

            // posting
            let publishedPostID;
            let result;
            switch (net.netName) {
                case 'twitter':
                    publishedPostID = await twitterPublisher.publish(keys.accessToken, keys.secretToken, content)
                        .catch(err => {
                            console.log("TCL: err", err)
                            reject(err);
                        });
                    resolve(publishedPostID);
                    break;

                case 'facebook':
                    let netType = await socialNetsModel.getNetTypeByNameAndId(net.netName, net.netId);
                    console.log("TCL: netType", netType)
                    if (netType == 'user') {
                        // await facebookPublisher.publish(keys.accessToken, keys.secretToken, content)
                        //     .catch(function (err) {
                        //         console.log("TCL: err", err)
                        //         errors.push(err)
                        //     });

                    } else if (netType == 'page') {
                        result = await facebookPagePublisher.publish(net.netId, keys.accessToken, keys.secretToken, content)
                        console.log("TCL: result", result)
                        if (result && result.success == false) {
                            reject(result.errors);
                        } else if (!result) {
                            reject('is not published');
                        } else {
                            resolve(result.publishedPostID);
                        }
                    }
                    reject('netType is unknown');
                    break;

                    // case 'pinterest':
                    //     break;

                    // case 'tumblr':
                    //     await tumblrPublisher.publish(net.netId, keys.accessToken, keys.secretToken, content)
                    //         .catch(err => {
                    //             console.log("TCL: err", err)
                    //             reject(err);
                    //         });
                    //     resolve(true);
                    //     break;

                case 'linkedin':
                    result = await linkedinPublisher.publish(net.netId, keys.accessToken, keys.secretToken, content)
                        .catch(err => {
                            console.log("TCL: err", err)
                            reject(err);
                        });
                    console.log("TCL: publishOneNet -> linkedin result-------------", result)
                    if (result && result.success == false) {
                        reject(result.errors);
                    } else if (!result) {
                        reject('is not published');
                    } else {
                        resolve(result.publishedPostID);
                    }
                    break;

                case 'instagram':
                    result = await instagramPublisher.publish(net.netId, keys.accessToken, keys.secretToken, keys.username, keys.password, content)
                        .catch(err => {
                            console.log("TCL: err", err)
                            reject(err);
                        });
                    console.log("TCL: publishOneNet -> instagram result-------------", result)
                    if (result && result.success == false) {
                        reject(result.errors);
                    } else if (!result) {
                        reject('is not published');
                    } else {
                        resolve(result.publishedPostID);
                    }
                    break;

                default:
                    reject('net name is unknown');
                    break;
            }

        } else {
            console.log("social name and id NOT found");
            reject("social name and id NOT found");
        }
    });
}