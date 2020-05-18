const express = require('express');
const router = express.Router();
const hasUserInRequest = require('../middleware/hasUserInRequest');
const isCardAttached = require('../middleware/isCardAttached');
const isSubscribed = require('../middleware/IsSubscribed');
const ImagesController = require('../controllers/ImagesController');


// only for logined, card attached and subscribed users
router.all('/*', hasUserInRequest, isCardAttached, isSubscribed);

router.get('/', ImagesController.index);

// api route from Vue request from image search page
router.get('/api/search', ImagesController.api_search);
router.get('/api/get-favorites', ImagesController.api_getFavorites);
router.post('/api/set-favorite', ImagesController.api_setFavorite);
router.post('/api/unset-favorite', ImagesController.api_unsetFavorite);


module.exports = router;