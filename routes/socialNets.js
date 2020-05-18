const express = require('express');
const router = express.Router();
const hasUserInRequest = require('../middleware/hasUserInRequest');
const isCardAttached = require('../middleware/isCardAttached');
const isSubscribed = require('../middleware/IsSubscribed');
const SocialNetsController = require('../controllers/SocialNetsController');

// only for logined, card attached and subscribed users
router.all('/*', hasUserInRequest, isCardAttached, isSubscribed);


// twitter
router.get('/twitter/connect', SocialNetsController.twitter_connect);
router.get('/twitter/:id/disconnect', SocialNetsController.twitter_disconnect);

// facebook
router.get('/facebook/connect', SocialNetsController.facebook_connect);
router.get('/facebook-pages/connect', SocialNetsController.facebook_pages_connect);
router.get('/facebook/:id/disconnect', SocialNetsController.facebook_disconnect);

// pinterest
router.get('/pinterest/connect', SocialNetsController.pinterest_connect);
router.get('/pinterest/:id/disconnect', SocialNetsController.pinterest_disconnect);

// tumblr
router.get('/tumblr/connect', SocialNetsController.tumblr_connect);
router.get('/tumblr/:id/disconnect', SocialNetsController.tumblr_disconnect);

// linkedin
router.get('/linkedin/connect', SocialNetsController.linkedin_connect);
router.get('/linkedin-pages/connect', SocialNetsController.linkedin_pages_connect);
router.get('/linkedin/:id/disconnect', SocialNetsController.linkedin_disconnect);

// instagram
router.post('/instagram/connect', SocialNetsController.instagram_connect_without_passport);
router.get('/instagram/:id/disconnect', SocialNetsController.instagram_disconnect);

// api
router.get('/twitter/api/trends-by-place', SocialNetsController.getTwitterTrendsByPlace);
router.get('/twitter/api/search-by-word', SocialNetsController.getRemapedTweetsByWord);
router.get('/twitter/api/tweets-by-word', SocialNetsController.getTweetsByWord);

module.exports = router;