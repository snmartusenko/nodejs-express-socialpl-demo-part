const express = require('express');
const router = express.Router();
const passport = require('passport');
const hasUserInRequest = require('../middleware/hasUserInRequest');
const isSubscribed = require('../middleware/IsSubscribed');
const canConnectNewSocialNet = require('../middleware/canConnectNewSocialNet');

require('../passport_auth/facebook');
require('../passport_auth/twitter');
require('../passport_auth/pinterest');
require('../passport_auth/tumblr');
require('../passport_auth/linkedin');
require('../passport_auth/instagram');
require('../passport_auth/feedly');
require('../passport_auth/bitly');

// all requests
// router.all('/*', hasUserInRequest, isSubscribed);
router.all('*', hasUserInRequest, isSubscribed);


// facebook
// route for facebook authentication and link
// different scopes while logging in
router.get('/facebook', canConnectNewSocialNet, passport.setupFacebook(),
    // router.get('/facebook',
    passport.authenticate('facebook', {
        // scope: ['email', 'pages_show_list', 'user_posts', 'publish_pages', 'publish_video', 'manage_pages', 'publish_to_groups']
        scope: ['email']
    }));

router.get('/facebook-pages', canConnectNewSocialNet, passport.setupFacebookPages(),
    passport.authenticate('facebook', {
        // authType: 'reauthenticate',
        scope: ['email', 'pages_show_list', 'user_posts', 'publish_pages', 'publish_video', 'manage_pages', 'publish_to_groups']
    }))

// handle the callback after facebook has authenticated the user
router.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/dashboard/settings/#social_media_accounts',
    failureRedirect: '/dashboard/settings/#social_media_accounts',
}));


// twitter
// Redirect the user to Twitter for authentication.  When complete, Twitter
// will redirect the user back to the application at  /auth/twitter/callback
router.get('/twitter', canConnectNewSocialNet, passport.setupTwitter(), passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
router.get('/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/dashboard/settings/#social_media_accounts',
    failureRedirect: '/dashboard/settings/#social_media_accounts',
}));


// pinterest
router.get('/pinterest', canConnectNewSocialNet, passport.setupPinterest(), passport.authenticate('pinterest', {
    scope: ['read_public', 'write_public', 'read_relationships', 'write_relationships']
}));

router.get('/pinterest/callback',
    passport.authenticate('pinterest', {
        failureRedirect: '/dashboard/settings/#social_media_accounts'
    }),
    // Successful authentication, redirect home.
    function (err, req, res, next) {
        console.log('err', err);
        res.redirect('/dashboard/settings/#social_media_accounts');
    }
);


// tumblr
router.get('/tumblr', canConnectNewSocialNet, passport.setupTumblr(), passport.authenticate('tumblr'));

router.get('/tumblr/callback', passport.authenticate('tumblr', {
        failureRedirect: '/dashboard/settings/#social_media_accounts'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/dashboard/settings/#social_media_accounts');
    });


// linkedin
router.get('/linkedin', canConnectNewSocialNet, passport.setupLinkedin(), passport.authenticate('linkedin', {
        state: 'SOME STATE'
    }),
    function (req, res) {
        // The request will be redirected to LinkedIn for authentication, so this
        // function will not be called.
    });

router.get('/linkedin-pages', canConnectNewSocialNet, passport.setupLinkedinPages(), passport.authenticate('linkedin', {
        state: 'SOME STATE'
    }),
    function (req, res) {
        // return res.redirect('/dashboard/settings');
        // The request will be redirected to LinkedIn for authentication, so this
        // function will not be called.
    });

router.get('/linkedin/callback', passport.authenticate('linkedin', {
    successRedirect: '/dashboard/settings/#social_media_accounts',
    failureRedirect: '/dashboard/settings/#social_media_accounts'
}));


// instagram
router.get('/instagram', canConnectNewSocialNet, passport.setupInstagram(), passport.authenticate('instagram'));

router.get('/instagram/callback', passport.authenticate('instagram', {
        failureRedirect: '/dashboard/settings/#social_media_accounts'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/dashboard/settings/#social_media_accounts');
    });


// feedly
router.get('/feedly', passport.setupFeedly(),
    passport.authenticate('feedly', {
        scope: 'https://cloud.feedly.com/subscriptions'
    }));

// handle the callback after feedly has authenticated the user
router.get('/feedly/callback', passport.authenticate('feedly', {
    successRedirect: '/dashboard/settings/#integrations',
    failureRedirect: '/dashboard/settings/#integrations',
}));


// bitly
router.get('/bitly', passport.setupBitly(), passport.authenticate('bitly'));

router.get('/bitly/callback', passport.authenticate('bitly', {
        failureRedirect: '/dashboard/settings/#integrations'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/dashboard/settings/#integrations');
    });


module.exports = router;
