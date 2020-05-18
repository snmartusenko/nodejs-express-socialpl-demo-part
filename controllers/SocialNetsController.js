const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8').trim());
const cryptor = require('../utils/cryptor');
const SocialNets = require('../models/SocialNets');
const rp = require('request-promise');
const instagramParser = require('../services/InstagramParser');
const instagramCredentialChecker = require('../services/InstagramCredentialChecker');
const {
    getTwitterBearerToken
} = require('../helpers/twitterHelper');
const twitterSearch = require('../services/TwitterSearch');


//facebook
module.exports.facebook_connect = function (req, res) {
    console.log('/facebook/connect');
    return res.redirect('/passport/facebook');
}

module.exports.facebook_pages_connect = function (req, res) {
    console.log('/facebook-pages/connect');
    return res.redirect('/passport/facebook-pages');
}

module.exports.facebook_disconnect = async function (req, res) {
    let model = await SocialNets.findOne({
        userID: req.user.id
    });
    if (model) {
        model.removeSocialNetData('facebook', req.params.id);
        console.log('facebook was disconnected');
    }
    return res.redirect('/dashboard/settings/#social_media_accounts');
}

//twitter
module.exports.twitter_connect = function (req, res) {
    console.log('/twitter/connect');
    return res.redirect('/passport/twitter');
}

module.exports.twitter_disconnect = async function (req, res) {
    let model = await SocialNets.findOne({
        userID: req.user.id
    });
    if (model) {
        model.removeSocialNetData('twitter', req.params.id);
        console.log('twitter was disconnected');
    }
    return res.redirect('/dashboard/settings/#social_media_accounts');
}


//pinterest
module.exports.pinterest_connect = function (req, res) {
    console.log('/pinterest/connect');
    return res.redirect('/passport/pinterest');
}

module.exports.pinterest_disconnect = async function (req, res) {
    let model = await SocialNets.findOne({
        userID: req.user.id
    });
    if (model) {
        model.removeSocialNetData('pinterest', req.params.id);
        console.log('pinterest was disconnected');
    }
    return res.redirect('/dashboard/settings/#social_media_accounts');
}


//tumblr
module.exports.tumblr_connect = function (req, res) {
    console.log('/tumblr/connect');
    return res.redirect('/passport/tumblr');
}

module.exports.tumblr_disconnect = async function (req, res) {
    let model = await SocialNets.findOne({
        userID: req.user.id
    });
    if (model) {
        model.removeSocialNetData('tumblr', req.params.id);
        console.log('tumblr was disconnected');
    }
    return res.redirect('/dashboard/settings/#social_media_accounts');
}


//linkedin
module.exports.linkedin_connect = function (req, res) {
    console.log('/linkedin/connect');
    return res.redirect('/passport/linkedin');
}

module.exports.linkedin_pages_connect = function (req, res) {
    console.log('/linkedin-pages/connect');
    return res.redirect('/passport/linkedin-pages');
}

module.exports.linkedin_disconnect = async function (req, res) {
    let model = await SocialNets.findOne({
        userID: req.user.id
    });
    if (model) {
        model.removeSocialNetData('linkedin', req.params.id);
        console.log('linkedin was disconnected');
    }
    return res.redirect('/dashboard/settings/#social_media_accounts');
}


//instagram
module.exports.instagram_connect = function (req, res) {
    console.log('/instagram/connect');
    return res.redirect('/passport/instagram');
}

module.exports.instagram_connect_without_passport = async function (req, res) {
    console.log('instagram_connect_without_passport');
    let username = req.body.username;
    let password = req.body.password;
    // console.log("TCL: username", username)
    // console.log("TCL: password", password)

    // // for testing only
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: userID = 5cee78766f68d655c422d890");
    // }

    if (!username) return res.json('username is empty');
    if (!password) return res.json('password is empty');

    let isCredentialValid = await instagramCredentialChecker.check(username, password);
    console.log("TCL: isCredentialValid", isCredentialValid)
    if (isCredentialValid) {
        let profile = await instagramParser.fetchShortUserProfile(username)
            .catch(err => res.json(err));
        console.log("TCL: module.exports.publish -> profile.id", profile.id)
        if (!profile || !profile.id) {
            return res.json('can not fetch user profile');
        } else {
            let instagramData = {
                id: profile.id,
                accessToken: null,
                refreshToken: null,
                login: username,
                password: cryptor.encrypt(password),
                profile: profile,
            }
            let result = await SocialNets.addSocialNetData('instagram', instagramData, req.user);
            if (result) {
                return res.json(result);
            } else {
                return res.json('Can not add social net to user');
            }
        }
    } else {
        return res.status(400).end('The credentials is not valid');
    }
}


module.exports.instagram_disconnect = async function (req, res) {
    let model = await SocialNets.findOne({
        userID: req.user.id
    });
    if (model) {
        model.removeSocialNetData('instagram', req.params.id);
        console.log('instagram was disconnected');
    }
    return res.redirect('/dashboard/settings/#social_media_accounts');
}


module.exports.getTwitterTrendsByPlace = async function (req, res) {
    // get placeGeoId
    let placeGeoId = req.query.placeGeoId || 1;
    console.log("TCL: placeGeoId", placeGeoId)

    // get placeName
    let placeName = req.query.placeName;
    console.log("TCL: placeName", placeName)

    // get place coordinates
    let latitude = parseFloat(req.query.latitude);
    let longitude = parseFloat(req.query.longitude);
    // console.log("TCL: latitude", latitude)
    // console.log("TCL: longitude", longitude)

    // get twitter place geo id
    let woeid = await getTwitterWoeidByCoordinates(latitude, longitude)
        .catch(err => {
            console.log("TCL: err.message", err.message)
        })
    console.log("TCL: woeid", woeid)

    // get trends
    let trends = await getTwitterTrendsByPlaceId(woeid || placeGeoId)
        .catch(err => {
            console.log("TCL: err.message", err.message)
            res.json(err.message);
        })
    console.log("TCL: trends.length", trends ? trends.length : undefined)
    return res.json(trends);
}


module.exports.getRemapedTweetsByWord = async function (req, res) {
    let queryWord = req.query.queryWord;
    if (queryWord == null || queryWord == '') {
        return res.json([]);
    }

    let tweets = await twitterSearch.searchByWord(queryWord);
    return res.json(tweets ? tweets : []);
}


module.exports.getTweetsByWord = async function (req, res) {
    let queryWord = req.query.queryWord;
    if (queryWord == null || queryWord == '') {
        return res.json([]);
    }

    let tweets = await twitterSearch.getTweetsByWord(queryWord);
    return res.json(tweets ? tweets : []);
}


function getTwitterWoeidByCoordinates(latitude, longitude) {
    return new Promise(async (resolve, reject) => {
        // get bearer token
        let twitterBearerToken = await getTwitterBearerToken()
            .catch(err => {
                reject(err);
            })

        // get woeid
        const optionsWoeid = {
            url: `https://api.twitter.com/1.1/trends/closest.json?lat=${latitude}&long=${longitude}`,
            headers: {
                'Authorization': 'Bearer ' + twitterBearerToken,
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'mode': 'cors'
            }
        }
        try {
            await rp.get(optionsWoeid, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    // console.log("TCL: getTwitterWoeidByCoordinates -> response.body", response.body)
                    if (!response || !response.body) reject(false);
                    const closestAreaVerbose = JSON.parse(response.body)[0]
                    // console.log("TCL: getTwitterWoeidByCoordinates -> closestAreaVerbose", closestAreaVerbose)
                    if (closestAreaVerbose) {
                        resolve(closestAreaVerbose.woeid);
                        // resolve({
                        //     name: closestAreaVerbose.name,
                        //     country: closestAreaVerbose.country,
                        //     id: closestAreaVerbose.woeid
                        // })
                    }
                }
            })
            return null;
        } catch (err) {
            reject(err);
        }
    })
}


function getTwitterTrendsByPlaceId(id) {
    return new Promise(async (resolve, reject) => {
        // get bearer token
        let twitterBearerToken = await getTwitterBearerToken()
            .catch(err => {
                reject(err);
            })

        // get trends
        const topicsURL = 'https://api.twitter.com/1.1/trends/place.json?id=' + id || 1;
        const optionsTopics = {
            url: topicsURL,
            headers: {
                'Authorization': 'Bearer ' + twitterBearerToken,
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'mode': 'cors'
            }
        }
        let trends = []
        try {
            await rp.get(optionsTopics, (error, response, body) => {
                // console.log("TCL: response", response)
                // console.log("TCL: body", body)
                // console.log("TCL: response.body", response.body)
                // console.log("TCL: error", error)

                if (error) {
                    reject(error);
                } else {
                    if (!response || !response.body) reject(false);
                    let trendsObj = JSON.parse(response.body)[0];
                    trends = trendsObj ? trendsObj.trends : undefined;
                }
            })
            resolve(trends);
        } catch (err) {
            reject(err);
        }
    });
}
