const fs = require("fs");
const path = require('path');
const CONFIG = JSON.parse(fs.readFileSync("config.json", "utf8").trim());
const stringHelper = require('../helpers/string');
const downloadHelper = require('../helpers/download');
const FB = require('fb');
const mongoose = require('mongoose');
const SocialNets = require('../models/SocialNets');
const SchedulePosts = require('../models/SchedulePosts');
const socialNetsPublisher = require('../services/socialNetsPublisher');
const UserActivity = require('../models/UserActivity');
const Bitly = require('../models/Bitly');
const moment = require('moment');
moment().format();


// map nets data from request to model
let getNetsArrayFromRequest = function (nets) {
    let result = [];
    for (net of nets) {
        if (net.provider == 'tumblr') net.id = net.username;

        result.push({
            netName: net.provider,
            netId: net.id,
            publishStatus: 'scheduled',
            errors: null,
        })
    }
    // console.log("TCL: getNetsArrayFromRequest -> result", result)
    return result;
}


let getImagesArrayFromRequest = function (files) {
    let result = [];
    for (file of files) {
        let fieldname = file.fieldname.split('_')[0];
        if (fieldname == 'image') result.push(file);
    }
    // console.log("TCL: getImagesArrayFromRequest -> result", result)
    return result;
}

let getVideosArrayFromRequest = function (files) {
    let result = [];
    for (file of files) {
        let fieldname = file.fieldname.split('_')[0];
        if (fieldname == 'video') result.push(file);
    }
    // console.log("TCL: getVideosArrayFromRequest -> result", result)
    return result;
}

let copyImagesArray = function (images) {
    for (image of images) {
        let fileName = Date.now() + '_' + image.originalname;
        console.log("TCL: copyImagesArray -> new fileName", fileName)
        image.originalname = image.filename;
        image.filename = fileName;
        let newPath = path.join(image.destination, fileName)
        console.log("TCL: copyImagesArray -> new path", newPath)
        fs.copyFileSync(image.path, newPath)
        image.path = newPath;
    }
    // console.log("TCL: copyImagesArray -> images", images)
    return images;
}

let copyVideosArray = function (videos) {
    for (video of videos) {
        let fileName = Date.now() + '_' + video.originalname;
        console.log("TCL: copyVideosArray -> new fileName", fileName)
        video.originalname = video.filename;
        video.filename = fileName;
        let newPath = path.join(video.destination, fileName)
        console.log("TCL: copyVideosArray -> new path", newPath)
        fs.copyFileSync(video.path, newPath)
        video.path = newPath;
    }
    // console.log("TCL: copyImagesArray -> video", video)
    return videos;
}

let getDataFromRequest = async function (req) {
    // console.log("TCL: getDataFromRequest")
    // console.log("TCL: req.body", req.body);

    // // for testing only
    // console.log("TCL: date now =", Date.now());
    // console.log("TCL: tz=", new Date().getTimezoneOffset());
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: userID = 5cee78766f68d655c422d890");
    // }

    let data = {};
    // process
    data.userID = req.user.id;
    if (req.body.articleType) data.articleType = req.body.articleType;

    // process postNow (frontend uses it)
    data.postNow = (req.body.postNow == 'true');

    // process the incoming message
    let message = req.body.articleContent;
    let isShortLinks = (req.body.bitlyCheckbox == 'true');
    // console.log("TCL: isShortLinks", isShortLinks)
    if (message && isShortLinks) {
        let bitly = await Bitly.findOne({
            userID: req.user.id
        });
        if (bitly) {
            let urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            message = await stringHelper.replaceAsync(message, urlRegex, async function (url) {
                console.log("TCL: url", url)
                let shortUrl = await bitly.shortenUrl(url);
                console.log("TCL: shortUrl", shortUrl)
                return shortUrl ? shortUrl : url;
            });
            data.usedBitly = true;
        }
    }
    // console.log("TCL: message", message)
    if (message) data.message = message;

    // process the incoming nets
    if (req.body.nets) {
        if (typeof req.body.nets == 'string') req.body.nets = JSON.parse(req.body.nets);
        data.nets = getNetsArrayFromRequest(req.body.nets);
    }

    // process
    if (req.body.originalUrl) data.originalUrl = req.body.originalUrl;

    // console.log("TCL: req.body.imageUrl", req.body.imageUrl)
    if (req.body.imageUrl && (req.body.articleType == 'rss' || req.body.articleType == 'social')) {
        let localPath = `${__dirname}/../uploads/post_content/${req.body.articleType}_${Date.now()}.jpg`;
        // console.log("TCL: localPath", localPath)
        let image = await downloadHelper.fetchAndSaveImage(req.body.imageUrl, localPath)
        // console.log("TCL: image", image)
        data.images = [image];
    }

    // process the incoming statuses
    if (req.body.approveStatus) data.approveStatus = req.body.approveStatus;
    if (req.body.publishStatus) data.publishStatus = req.body.publishStatus;

    // process the incoming publishTime
    console.log("TCL: req.body.publishTime", req.body.publishTime)
    if (req.body.publishTime === null || req.body.publishTime === 'null') {
        data.publishTime = null;
    } else if (req.body.publishTime) {
        let publishTime; // moment object
        // parse publishTime (timestamp/string)
        console.log("req.body.publishTime len=", req.body.publishTime.length)

        if (req.body.publishTime.length == 10) //unix in sec
            publishTime = moment.unix(req.body.publishTime);
        else if (req.body.publishTime.length == 13) //unix in millisec
            publishTime = moment.unix(req.body.publishTime / 1000);
        else //unix as human string
            publishTime = moment(req.body.publishTime);

        // check
        if (req.body.publishTime && (!publishTime || !publishTime.isValid())) {
            console.log("TCL: publishTime is not valid")
            // return res.status(400).end('bad publishTime');
        } else {
            console.log("TCL: publishTime", publishTime)
            console.log("TCL: publishTime.toDate()", publishTime.toDate())
            data.publishTime = publishTime.toDate();
        }
    }

    // console.log("TCL: data", data)
    return data;
}


module.exports.index = async function (req, res) {
    console.log('postcontent_index');
    let socialNets = await SocialNets.findOne({
        userID: req.user.id
    });
    let bitly = await Bitly.findOne({
        userID: req.user.id
    });

    return res.render('panels/post-content/index.ejs', {
        title: "Post Content",
        user: req.user,
        bitly: bitly,
        AppName: CONFIG.AppName,
        socialNets: socialNets ? socialNets.getResponseForWeb() : null,
    });
}


module.exports.api_scheduledPostCreate = async function (req, res) {
    console.log("post_by_schedule");

    // // for testing only
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: userID = 5cee78766f68d655c422d890");
    // }

    // process incoming data    
    let data = await getDataFromRequest(req);

    // upload media and add to data
    if (req.files && req.files.length != 0) data.images = getImagesArrayFromRequest(req.files);
    if (req.files && req.files.length != 0) data.videos = getVideosArrayFromRequest(req.files);

    // create a shedule post model from data
    SchedulePosts.create(data)
        .then(model => {
            // log
            if (model.postNow == false && (model.articleType == 'rss' || model.articleType == 'social')) {
                UserActivity.logAddingPostToScheduled(model);
            }
            return res.json(model);
        })
        .catch(err => {
            console.log("TCL: module.exports.post_by_schedule -> err", err.message);
            return res.status(400).end(err.message);
        });
}


module.exports.api_getSchedule = async function (req, res) {
    console.log("TCL: api_getSchedule")
    let startTime, endTime = null;

    // // for testing only
    // console.log("TCL: date now =", Date.now());
    // console.log("TCL: tz=", new Date().getTimezoneOffset());
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: userID = 5cee78766f68d655c422d890");
    // }

    // parse date and time (timestamp/string)
    console.log("startTime req.query.from len=", req.query.from.length)

    if (req.query.from.length == 10) //unix in sec
        startTime = moment.unix(req.query.from);
    else if (req.query.from.length == 13) //unix in millisec
        startTime = moment.unix(req.query.from / 1000);
    else //unix as human string
        startTime = moment(req.query.from);

    console.log("endTime req.query.to len=", req.query.to.length)
    if (req.query.to.length == 10) //unix in sec
        endTime = moment.unix(req.query.to);
    else if (req.query.to.length == 13) //unix in millisec
        endTime = moment.unix(req.query.to / 1000);
    else //unix as human string
        endTime = moment(req.query.to);

    console.log("startTime", typeof startTime, startTime)
    console.log("endTime", typeof endTime, endTime)

    // check
    if (req.query.from && (!startTime || !startTime.isValid())) {
        console.log("TCL: startTime is not valid")
        return res.status(400).end('bad date from');
    }

    if (req.query.to && (!endTime || !endTime.isValid())) {
        console.log("TCL: endTime is not valid")
        return res.status(400).end('bad date to');
    }

    // let month = req.query.month;
    // let week = req.query.week;
    // console.log("month", month)
    // console.log("week", week)

    console.log("TCL: startTime.toDate()", startTime.toDate())
    console.log("TCL: endTime.toDate()", endTime.toDate())

    // search
    models = await SchedulePosts.find()
        .where({
            userID: req.user.id,
            publishTime: {
                "$gte": startTime.toDate(),
                "$lte": endTime.toDate(),
            }
        });
    console.log("TCL: models len =", models.length)

    res.end(JSON.stringify(models));
}


module.exports.api_scheduledPostUpdate = async function (req, res) {
    console.log("TCL: api_scheduledPostUpdate")
    // console.log("TCL: req.body", req.body)

    // // for testing only
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: userID = 5cee78766f68d655c422d890");
    // }

    // process incoming data
    let data = await getDataFromRequest(req);

    // upload media and add to data
    console.log("TCL: req.files.length", req.files.length)
    if (req.files && req.files.length != 0) data.images = getImagesArrayFromRequest(req.files);
    if (req.files && req.files.length != 0) data.videos = getVideosArrayFromRequest(req.files);
    console.log("TCL: data", data)

    // find and update model
    let model = await SchedulePosts.findOneAndUpdate({
            _id: req.params.id
        }, data, {
            new: true // return updated model
        })
        .catch(err => {
            console.log("TCL: module.exports.post_by_schedule -> err", err.message);
            return res.status(400).end(err.message);
        });

    if (model) {
        // // log
        // if (model.isReadyToPublishing() && model.postNow == false && (model.articleType == 'rss' || model.articleType == 'social')) {
        //     UserActivity.logAddingPostToScheduled(model);
        // }
        return res.json(model);
    } else {
        return res.sendStatus(404);
    }

    // // set data into model   

    // // save model
    // model.save()
    //     .then(model => {
    //         return res.json(model);
    //     })
    //     .catch(err => {
    //         console.log("TCL: module.exports.post_by_schedule -> err", err.message);
    //         return res.status(400).end(err.message);
    //     });
}

module.exports.api_scheduledPostHideInReview = async function (req, res) {
    // find and update model
    let data = {
        hideInReview: true
    };
    let model = await SchedulePosts.findOneAndUpdate({
            _id: req.params.id
        }, data, {
            new: true // return updated model
        })
        .catch(err => {
            console.log("TCL: module.exports.api_scheduledPostHideInReview -> err", err.message);
            return res.status(400).end(err.message);
        });

    if (model) {
        return res.json(model);

    } else {
        return res.sendStatus(404);
    }
}

module.exports.api_getNullPublishTimeSchedule = async function (req, res) {
    console.log("TCL: api_getNullPublishTimeSchedule")

    // // for testing only
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: userID = 5cee78766f68d655c422d890");
    // }

    models = await SchedulePosts.find()
        .where({
            userID: req.user.id,
            $or: [{
                    publishTime: null
                },
                {
                    publishTime: 'null'
                }
            ]
        });
    console.log("TCL: models len =", models.length)

    res.end(JSON.stringify(models));
}


module.exports.api_postNow = async function (req, res) {
    console.log("TCL: --------------------------------api_postNow-------------------")
    // console.log("TCL: req.body", req.body)

    // // for testing only
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: userID = 5cee78766f68d655c422d890");
    // }

    // process incoming data
    let data = await getDataFromRequest(req);

    // set field for publish now
    data.approveStatus = 'approved';
    data.publishStatus = 'unpublished';
    data.publishTime = new Date();

    // upload media and add to data
    // console.log("TCL: req.files.length", req.files.length)
    if (req.files && req.files.length != 0) data.images = getImagesArrayFromRequest(req.files);
    if (req.files && req.files.length != 0) data.videos = getVideosArrayFromRequest(req.files);
    // console.log("TCL: data", data)

    let model;
    if (req.body.id) {
        // find and update model
        console.log("TCL: find and update model")
        model = await SchedulePosts.findOneAndUpdate({
                _id: req.body.id
            }, data, {
                new: true // return updated model
            })
            .catch(err => {
                console.log("TCL: err", err.message);
                return res.status(400).end(err.message);
            });
    } else {
        // create a shedule post model from data
        console.log("TCL: create a shedule post model from data")
        model = new SchedulePosts(data)
        await model.save()
            .catch(err => {
                console.log("TCL: err", err.message);
                return res.status(400).end(err.message);
            });
    }
    console.log("TCL: model", model)

    if (!model) return res.sendStatus(404);

    // publish shedule post model
    if (model.isReadyToPublishing()) {
        let result = await socialNetsPublisher.postNow(model);

        if (result && result.publishedPost) {
            return res.json({
                success: true,
                scheduledPostId: model.id,
                publishedPost: result.publishedPost,
                errors: null,
            });

        } else if (result && result.errors) {
            return res.status(400).json({
                success: false,
                scheduledPostId: model.id,
                errors: result.errors,
            })

        } else {
            return res.status(400).json({
                success: false,
                scheduledPostId: model.id,
                errors: 'Is not published. General publisher error',
            })
        }

    } else {
        return res.status(400).end('Post is not ready to publishing');
    }
}


module.exports.api_scheduledPostClone = async function (req, res) {
    console.log("TCL: module.exports.api_scheduledPostClone")

    let original = await SchedulePosts.findOne({
            _id: req.params.id
        })
        .catch(err => {
            console.log("TCL: err", err)
        });

    if (!original) return res.sendStatus(404);

    let clone = new SchedulePosts(original)
    clone.isNew = true;
    clone._id = mongoose.Types.ObjectId();
    clone.createdAt = Date.now();
    // set hideInReview to false for showing in review page
    clone.hideInReview = false;

    if (original.images.length != 0) original.images = copyImagesArray(original.images)
    if (original.videos.length != 0) original.videos = copyVideosArray(original.videos)

    await clone.save()
        .catch(err => {
            console.log("TCL: err", err)
            return res.status(500).end(err.message)
        })

    return res.json(clone);
}


module.exports.api_scheduledPostDelete = function (req, res) {
    console.log("TCL: module.exports.api_scheduledPostDelete")

    SchedulePosts.findOneAndDelete({
            _id: req.params.id
        })
        .exec(function (err, model) {
            if (!model) return res.sendStatus(404);
            if (err) return res.send(err);

            // delete media files
            for (image of model.images) {
                try {
                    fs.unlinkSync(image.path)
                } catch (err) {
                    console.error(err)
                }
            }
            for (video of model.videos) {
                try {
                    fs.unlinkSync(video.path)
                } catch (err) {
                    console.error(err)
                }
            }

            return res.json(model);
        });
}


module.exports.api_getScheduledPostPublishStatus = async function (req, res) {
    // console.log("TCL: module.exports.api_getScheduledPostPublishStatus ->")
    let model = await SchedulePosts.findOne({
        _id: req.params.id
    }).catch(err => {
        console.log("TCL: err", err)
        return res.sendStatus(400);
    })
    if (!model) return res.sendStatus(404);

    // console.log("TCL: model.publishStatus", model.publishStatus)

    if (model.publishStatus == 'published') {
        return res.json({
            success: true,
            errors: null,
        });
    } else if (model.publishStatus == 'errors') {
        // collect errors
        let results = {};
        for (const net of model.nets) {
            // console.log("TCL: net", net)
            if (!results[net.netName]) {
                results[net.netName] = {};
            };
            if (net.publishStatus == 'published') {
                results[net.netName][net.netId] = {
                    success: true,
                    // errors: null,
                }
            } else if (net.publishStatus == 'errors') {
                results[net.netName][net.netId] = {
                    success: false,
                    // errors: net.errors,
                }
            }
        }
        return res.json({
            success: false,
            errors: results,
        });
    }

    return res.json('the post is scheduled');
}