const express = require('express');
const router = express.Router();
const hasUserInRequest = require('../middleware/hasUserInRequest');
const isCardAttached = require('../middleware/isCardAttached');
const isSubscribed = require('../middleware/IsSubscribed');
const canConnectBitly = require('../middleware/canConnectBitly');
const IntegrationController = require('../controllers/IntegrationController');


// only for logined, card attached and subscribed users
router.all('/*', hasUserInRequest, isCardAttached, isSubscribed);

// feedly
router.get('/feedly/connect', IntegrationController.feedly_connect);

// pocket
router.get('/pocket/connect', IntegrationController.pocket_connect);
router.get('/pocket/connect/callback', IntegrationController.pocket_connect_callback);
router.post('/pocket/disconnect', IntegrationController.pocket_disconnect);

// bitly
router.get('/bitly/connect', canConnectBitly, IntegrationController.bitly_connect);
router.post('/bitly/disconnect', IntegrationController.bitly_disconnect);
router.get('/bitly/shorten', IntegrationController.bitly_shorten);

// word-ai and spin-rewriter
router.post('/word-ai/save', IntegrationController.word_ai_save);
router.post('/spin-rewriter/save', IntegrationController.spin_rewriter_save);


module.exports = router;