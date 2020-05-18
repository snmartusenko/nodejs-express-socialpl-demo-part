const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const hasUserInRequest = require('../middleware/hasUserInRequest');
const isCardAttached = require('../middleware/isCardAttached');
const isSubscribed = require('../middleware/IsSubscribed');
const PostContentController = require('../controllers/PostContentController');
const socialNetsPublisherBySchedule = require('../services/socialNetsPublisherBySchedule');
const upload = require('../helpers/upload');
const canPublish = require('../middleware/canPublish');


// only for logined, card attached and subscribed users
router.all('/*', hasUserInRequest, isCardAttached, canPublish, isSubscribed);

// web
router.get('/', PostContentController.index);


// api
router.get('/api/get-schedule', PostContentController.api_getSchedule);
router.get('/api/get-null-publish-time-schedule', PostContentController.api_getNullPublishTimeSchedule);
router.get('/api/get-scheduled-post-publish-status/:id', PostContentController.api_getScheduledPostPublishStatus);

router.post('/api/post-by-schedule',
    bodyParser.urlencoded({
        extended: true
    }),
    // set req.params.multerDestinationFolder    
    (req, res, next) => {
        req.params.multerDestinationFolder = 'post_content';
        next();
    },
    // upload.array('images', 20),
    // upload.single('video', 1),
    // upload.fields([{
    //     name: 'images',
    //     maxCount: 20
    // }, {
    //     name: 'video',
    //     maxCount: 1
    // }]),
    upload.any(),
    PostContentController.api_scheduledPostCreate);

router.post('/api/scheduled-post/:id/update',
    bodyParser.urlencoded({
        extended: true
    }),
    // set req.params.multerDestinationFolder    
    (req, res, next) => {
        req.params.multerDestinationFolder = 'post_content';
        next();
    },
    upload.any(),
    PostContentController.api_scheduledPostUpdate)

router.post('/api/scheduled-post/:id/hide-in-review', PostContentController.api_scheduledPostHideInReview)
router.post('/api/scheduled-post/:id/clone', PostContentController.api_scheduledPostClone)
router.post('/api/scheduled-post/:id/delete', PostContentController.api_scheduledPostDelete)

router.post('/api/post-now', bodyParser.urlencoded({
        extended: true
    }),
    // set req.params.multerDestinationFolder    
    (req, res, next) => {
        req.params.multerDestinationFolder = 'post_content';
        next();
    },
    upload.any(),
    PostContentController.api_postNow);


// only for testing and development
router.get('/api/run-publisher-cron-action', async (req, res) => {
    let result = await socialNetsPublisherBySchedule.action();
    console.log("TCL: run-publisher-cron-action result ", result ? result.publishedPosts.length : 0, " from ", result ? result.scheduledPosts.length : 0)
    return res.json(result)
});


module.exports = router;