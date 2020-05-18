const path = require('path');
const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8').trim());
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const SocialNets = require('../models/SocialNets');
const FacebookPages = require('../models/FacebookPages');
const SocialNetsLimitChecker = require('../utils/SocialNetsLimitChecker');


let isStrategySetup = false;

passport.setupFacebook = () => {
    return function (req, res, next) {

        // const callbackURL = "https://socialplanner-io.loc:3100/passport/facebook/callback";            //local
        // const callbackURL = "https://10d08070.ngrok.io/passport/facebook/callback";                  //ngrok
        // const callbackURL = "https://app.socialplanner.io/passport/facebook/callback";                 //prod
        // const callbackURL = "https://" + path.join(req.hostname, '/passport/facebook/callback');     //universal
        const callbackURL = "https://" + CONFIG.AppDomain + '/passport/facebook/callback'; //from config
        console.log('callbackURL', callbackURL);

        if (!isStrategySetup) {

            passport.use(new FacebookStrategy({
                    clientID: CONFIG.FacebookKeys.FACEBOOK_APP_ID,
                    clientSecret: CONFIG.FacebookKeys.FACEBOOK_APP_SECRET,
                    callbackURL: callbackURL,
                    passReqToCallback: true,
                    enableProof: true,
                },
                function (req, accessToken, refreshToken, profile, done) {
                    let facebookData = {
                        id: profile.id,
                        type: 'user',
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        profile: profile,
                    }
                    console.log('passport facebook successful');
                    let result = SocialNets.addSocialNetData('facebook', facebookData, req.user);
                    console.log('add_to_user', result);

                    if (result) {
                        return done(null, req.user, result);
                    }
                    return done('Can not add social net to user');
                }
            ));

            isStrategySetup = true;
        }

        next();
    };
}

passport.setupFacebookPages = () => {
    return function (req, res, next) {
        const callbackURL = "https://" + CONFIG.AppDomain + '/passport/facebook/callback'; //from config
        console.log('callbackURL', callbackURL);

        if (!isStrategySetup) {
            passport.use(new FacebookStrategy({
                    clientID: CONFIG.FacebookKeys.FACEBOOK_APP_ID,
                    clientSecret: CONFIG.FacebookKeys.FACEBOOK_APP_SECRET,
                    callbackURL: callbackURL,
                    passReqToCallback: true,
                    enableProof: true,
                },
                async function (req, accessToken, refreshToken, profile, done) {
                    let facebookData = {
                        id: profile.id,
                        type: 'user',
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        profile: profile,
                    }
                    console.log('passport facebook pages successful');

                    let socialNet = await SocialNets.addSocialNetData('facebook', facebookData, req.user);
                    console.log('add_to_user', socialNet ? true : false);
                    if (socialNet) {
                        console.log("TCL: passport.setupFacebookPages -> socialNet is resolved", socialNet ? true : false)
                        // create/update facebookPages
                        // let isFacebookPagesAdded = await FacebookPages.addPagesFromRequestAndNetId(req, facebookData.id);
                        let isFacebookPagesAdded = await addFacebookPagesForUserNet(socialNet, facebookData.id, req.user);
                        console.log("TCL: passport.setupFacebookPages -> isFacebookPagesAdded", isFacebookPagesAdded)
                        if (isFacebookPagesAdded) {
                            return done(null, req.user);
                        } else
                            return done('Can not add social page to user');

                    } else
                        return done('Can not add social net to user');
                }
            ));
            isStrategySetup = true;
        }
        next();
    };
}

// addFacebookPagesForUserNet
let addFacebookPagesForUserNet = async function (socialNet, netId, user) {
    console.log("TCL:-----------------addFacebookPagesForUserNet---------------------------");
    console.log("TCL: addFacebookPagesForUserNet -> netId", netId)

    // get user token
    let userTokens = socialNet.getTokensByNetNameAndId('facebook', netId);
    console.log("TCL: addFacebookPagesForUserNet -> userTokens", userTokens)
    if (!userTokens) return false;
    const FB = require('fb');
    FB.setAccessToken(userTokens.accessToken);

    // get all pages
    let result = await FB.api(`me/accounts`, 'get')
        .catch(err => {
            console.log("TCL: addFacebookPagesForUserNet -> err", err)
            return false;
        });
    // console.log("TCL: addFacebookPagesForUserNet -> result", result)
    let pages = result.data;

    let errors = [];
    let storedPages = [];
    for (page of pages) {
        console.log("TCL: page.id", page.id)

        // check account limit
        let canConnect = await SocialNetsLimitChecker.canConnectNewSocialNetForUser(user);
        console.log("TCL: canConnect", canConnect)
        if (canConnect) {
            // create/update facebookPage net slot
            let netData = {
                id: page.id,
                type: 'page',
                facebookUserId: netId,
                accessToken: page.access_token,
                profile: {
                    id: page.id,
                    displayName: page.name,
                    name: page.name,
                    provider: 'facebook',
                    _raw: `{"name":"${page.name}","id":"${page.id}"}`,
                    _json: {
                        name: page.name,
                        id: page.id,
                    }
                }
            }
            let isStored = await socialNet.addFacebookPageData(netData);
            if (isStored) storedPages.push(page);
        }
    }

    if (errors.length == 0) return storedPages;
    else {
        console.log("TCL: addFacebookPagesForUserNet -> errors", errors)
        return false;
    }
}

module.exports = passport;