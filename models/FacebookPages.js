const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const FB = require('fb');
const SocialNets = require('../models/SocialNets');


const FacebookPageSchema = new Schema({
    userID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    facebookPageID: {
        type: String,
    },
    facebookPageName: {
        type: String,
    },
    facebookUserID: {
        type: String,
    },
    pageAccessToken: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


// findOneOrCreate
FacebookPageSchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
    const one = await this.findOne(condition);
    return one || await this.create(doc);
});


FacebookPageSchema.static('addPagesFromRequestAndNetId', async function addPagesFromRequestAndNetId(req, netId) {
    console.log("TCL:-----------------addPagesFromRequest---------------------------");
    console.log("TCL: addPagesFromRequestAndNetId -> netId", netId)
    let version = FB.version;
    console.log("TCL: version", version);

    // find SocialNet model
    let socialNets = await SocialNets.findOne({
        userID: req.user.id
    })
    if (!socialNets) return false;
    console.log("TCL: addPagesFromRequestAndNetId -> socialNets.id", socialNets.id)

    // get user token
    let userTokens = socialNets.getTokensByNetNameAndId('facebook', netId);
    console.log("TCL: addPagesFromRequestAndNetId -> userTokens", userTokens)

    if (!userTokens) return false;
    FB.setAccessToken(userTokens.accessToken);

    // get all pages
    let result = await FB.api(`me/accounts`, 'get')
        .catch(err => {
            console.log("TCL: addPagesFromRequestAndNetId -> err", err)
            return false;
        });
    // console.log("TCL: addPagesFromRequestAndNetId -> result", result)

    let pages = result.data;

    for (page of pages) {
        console.log("TCL: page.id", page.id)
        // create/update facebookPage model
        let doc = {
            userID: req.user.id,
            facebookPageID: page.id,
            facebookPageName: page.name,
            facebookUserID: netId,
            pageAccessToken: page.access_token,
        }

        let model = await FacebookPage.findOne({
            userID: req.user.id,
            facebookPageID: page.id,
            facebookUserID: netId,
        });
        if (model) {
            await model.update(doc)
                .catch(err => {
                    console.log("TCL: addPagesFromRequestAndNetId -> err", err)
                    return false;
                });;
        } else {
            model = await FacebookPage.create(doc)
                .catch(err => {
                    console.log("TCL: addPagesFromRequestAndNetId -> err", err)
                    return false;
                });;
        }
    }

    return true;
});


const FacebookPage = mongoose.model('FacebookPage', FacebookPageSchema);
module.exports = FacebookPage;