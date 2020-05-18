// Events                                                               -> links
// #1   publishes content to social network via the post scheduler      -> will take user to the planner
// #2   (disabled)  searches performed (completed) in social search 	-> will take user to the results, similar to "Saved Searches"
// #3   searches performed in article search 	                        -> will take user to the results, similar to "Saved Searches"
// #4   adding of rss article to favorites 	                            -> will take user to the favorites
// #5   adding a post to the queue from social and article search 	    -> will take user to the post content
// #6   error of publishing content to social network via the post scheduler    -> will take user to the planner
// #7   (in a scrapper)  searches error in social search                -> will take user to the results, similar to "Saved Searches" 
// #8   searches error in article search                                -> will take user to the results, similar to "Saved Searches"
// #9   searches started in social search 	                            -> will take user to the results, similar to "Saved Searches"
// #10   adding of social article to favorites 	                        -> will take user to the favorites
// #11   searches performed in image search 	                        -> will take user to the results, similar to "Saved Searches"
// #12   adding of image to favorites 	                                -> will take user to the favorites



const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ID_EVENT = {
    1: "publishes content to social network via the post scheduler",
    2: "searches completed in social search",
    3: "searches performed in article search",
    4: "adding of rss article to favorites",
    5: "adding a post to the queue from social and article search",
    6: "error of publishing content to social network via the post scheduler",
    7: "searches error in social search",
    8: "searches error in article search",
    9: "searches started in social search",
    10: "adding of social article to favorites",
    11: "searches performed in image search",
    12: "adding of image to favorites",
}


// UserActivity schema in app and scrapper must always be equals to each other
const UserActivitySchema = new Schema({
    userID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    eventId: {
        type: Number,
    },
    type: {
        type: String,
        enum: ['scheduled_post', 'rss_feed_id', 'social_article_id', 'found_image_id', 'social_search', 'article_search', 'image_search', 'scheduled_post_error'],
    },
    data: {
        type: String,
    },
    socialNetName: {
        type: String,
    },
    searchWord: {
        type: String,
    },
    keywordID: {
        type: Object,
    },
    object: {
        type: Object,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});


// virtual fields
UserActivitySchema
    .virtual('link')
    .get(function () {
        switch (this.eventId) {
            case 1:
                return `/planner`;
            case 2:
                return `/keywords/view/${this.keywordID}`;
            case 3:
                return `/articles?query=${this.searchWord}`;
            case 4:
                return `/dashboard/settings#favorites`;
            case 5:
                return `/post-content#shedule`;
            case 6:
                return `/planner`;
            case 7:
                return `/keywords/view/${this.keywordID}`;
            case 8:
                return `/articles?query=${this.searchWord}`;
            case 9:
                return `/keywords/view/${this.keywordID}`;
            case 10:
                return `/dashboard/settings#favorites`;
            case 11:
                return `/images?query=${this.searchWord}`;
            case 12:
                return `/dashboard/settings#favorites`;
            default:
                return null;
        }
    })


UserActivitySchema.static('getEventStringById', function (id) {
    if (0 < id || id > 5) return false;
    return ID_EVENT[id];
});


UserActivitySchema.static('getAllForUser', async function (id, limit = 10, offset = 0) {
    return await this.find()
        .where({
            userID: id
        })
        .limit(limit)
        .skip(offset)
        .sort({
            createdAt: 'desc'
        })
});


UserActivitySchema.static('getErrorsForAdmin', async function (limit = 10, offset = 0) {
    return await this.find()
        .where({
            eventId: {
                $in: [7, 8]
            }
        })
        .limit(limit)
        .skip(offset)
        .sort({
            createdAt: 'desc'
        })
});


// // don`t use it
// // all scheduledPostModel
// UserActivitySchema.static('logScheduledPostPublishing', async function (scheduledPostModel) {
//     let doc = {
//         userID: scheduledPostModel.userID,
//         eventId: 1,
//         type: 'scheduled_post',
//         data: scheduledPostModel.id,
//     }
//     console.log("TCL: UserActivity doc", doc)
//     return await this.create(doc)
//         .catch(err => {
//             console.log("TCL: err", err)
//             return false;
//         });
// });


// publishing of only one social net from scheduledPostModel
UserActivitySchema.static('logScheduledPostSocialNetPublishing', async function (scheduledPostModel, net) {
    let doc = {
        userID: scheduledPostModel.userID,
        eventId: 1,
        type: 'scheduled_post',
        data: scheduledPostModel.id,
        socialNetName: net.netName,
    }
    console.log("TCL: UserActivity doc", doc)
    return await this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logArticleSearchCompleting', async function (userID, searchWord) {
    let doc = {
        userID: userID,
        eventId: 3,
        type: 'article_search',
        searchWord: searchWord,
    }
    console.log("TCL: UserActivity doc", doc)
    return await this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logRSSFavoritesAddings', async function (userID, searchWord, rssModel) {
    let doc = {
        userID: userID,
        eventId: 4,
        type: 'rss_feed_id',
        data: rssModel.id,
        searchWord: searchWord,
    }
    console.log("TCL: UserActivity doc", doc)
    return this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logAddingPostToScheduled', async function (scheduledPostModel) {
    let doc = {
        userID: scheduledPostModel.userID,
        eventId: 5,
        type: 'scheduled_post',
        data: scheduledPostModel.id,
    }
    console.log("TCL: UserActivity doc", doc)
    return this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logPublishErrorOfSocialNetScheduledPost', async function (scheduledPostModel, net) {
    let doc = {
        userID: scheduledPostModel.userID,
        eventId: 6,
        type: 'scheduled_post_error',
        data: scheduledPostModel.id,
        socialNetName: net.netName,
    }
    console.log("TCL: UserActivity doc", doc)
    return await this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logArticleSearchError', async function (userID, searchWord) {
    let doc = {
        userID: userID,
        eventId: 8,
        type: 'article_search',
        searchWord: searchWord,
    }

    return await this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logSocialSearchStarting', async function (keywordModel) {
    // console.log("TCL: logSocialSearchStarting--------------------")
    if (keywordModel == null) return false;

    let doc = {
        userID: keywordModel.userID,
        eventId: 9,
        type: 'social_search',
        data: keywordModel.id,
        searchWord: keywordModel.userQuery.query,
        keywordID: keywordModel.id,
    }
    // console.log("TCL: doc", doc)

    return await this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logSocialFavoritesAddings', async function (userID, searchWord, socialArticlesModel) {
    let doc = {
        userID: userID,
        eventId: 10,
        type: 'social_article_id',
        data: socialArticlesModel.id,
        searchWord: searchWord,
    }
    console.log("TCL: UserActivity doc", doc)
    return this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logImageSearchCompleting', async function (userID, searchWord) {
    let doc = {
        userID: userID,
        eventId: 11,
        type: 'image_search',
        searchWord: searchWord,
    }
    console.log("TCL: UserActivity doc", doc)
    return await this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


UserActivitySchema.static('logImageFavoritesAddings', async function (userID, searchWord, foundImageModel) {
    let doc = {
        userID: userID,
        eventId: 12,
        type: 'found_image_id',
        data: foundImageModel.id,
        searchWord: searchWord,
    }
    console.log("TCL: UserActivity doc", doc)
    return this.create(doc)
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });
});


// get array for web views
UserActivitySchema.methods.getResponseForWeb = function () {
    return {
        id: this.id,
        userID: this.userID,

        createdAt: this.createdAt,
    };
}


module.exports = mongoose.model('UserActivity', UserActivitySchema);