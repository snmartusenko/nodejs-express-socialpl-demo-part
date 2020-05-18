const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SchedulePosts = require('../models/SchedulePosts');
const cryptor = require('../utils/cryptor');


const SocialNetSchema = new Schema({
    userID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    twitter: {
        type: Array,
        default: []
    },
    facebook: {
        type: Array,
        default: []
    },
    pinterest: {
        type: Array,
        default: []
    },
    tumblr: {
        type: Array,
        default: []
    },
    linkedin: {
        type: Array,
        default: []
    },
    instagram: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

// findOneOrCreate
SocialNetSchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
    const one = await this.findOne(condition);
    return one || this.create(doc);
});

// addSocialNetData
SocialNetSchema.static('addSocialNetData', async (netName, netData, user) => {

    netData = JSON.parse(JSON.stringify(netData));
    // console.log('netData', netData);
    if (netName == 'linkedin') {
        netData.profile._raw = null;
        netData.profile._json = null;
    }

    let model = await SocialNets.findOne({
        userID: user.id
    });
    if (!model) model = new SocialNets();

    model.userID = user.id; // for update or create model

    // find all stored nets array with this net name
    let netNameSlot = model[netName] || []; // for update or create model
    // console.log('netNameSlot', netNameSlot);

    if (netNameSlot) {
        // check if exist the one net from array with this name and id 
        let existedNet = netNameSlot.find(item => item.id == netData.id);
        // console.log('netData.id', netData.id);
        console.log('existedNet', existedNet ? true : false);

        // push netData for new model or if the net isn`t exist
        if (existedNet == undefined) {
            console.log('model[netName]', model[netName]);
            netNameSlot.push(netData);
        } else {
            // replace netData for one existed net in stored nets array
            let updatedNetNameSlot = [];
            for (item of netNameSlot) {
                if (item.id == netData.id) {
                    console.log("TCL: ------------- push netData")
                    updatedNetNameSlot.push(netData);
                } else {
                    console.log("TCL: ------------- push item")
                    updatedNetNameSlot.push(item);
                }
            }
            netNameSlot = updatedNetNameSlot;
        }

    } else {
        netNameSlot.push(netData);
    }

    // console.log('netNameSlot', netNameSlot);
    model[netName] = netNameSlot;

    if (model.save()) {
        // console.log(model[netName]);
        console.log(netName, ' was added/updated to this user');
        return model;
    }
    console.log(netName, ' was not added/updated to this user');
    return false;
});


SocialNetSchema.methods.addFacebookPageData = async function (netData) {
    console.log('netData', netData);

    let netName = 'facebook';
    // find all stored nets array with this net name
    let netNameSlot = this[netName] || []; // for update or create model
    // console.log('netNameSlot', netNameSlot);

    if (netNameSlot) {
        // check if exist the one net from array with this name and id 
        let existedNet = netNameSlot.find(item => item.id == netData.id);
        // console.log('netData.id', netData.id);
        console.log('existedNet', existedNet ? true : false);

        // push netData for new model or if the net isn`t exist
        if (existedNet == undefined) {
            // console.log('this[netName]', this[netName]);
            netNameSlot.push(netData);
        } else {
            // replace netData for one existed net in stored nets array
            let updatedNetNameSlot = [];
            for (item of netNameSlot) {
                if (item.id == netData.id) {
                    console.log("TCL: ------------- push netData")
                    updatedNetNameSlot.push(netData);
                } else {
                    console.log("TCL: ------------- push item")
                    updatedNetNameSlot.push(item);
                }
            }
            netNameSlot = updatedNetNameSlot;
        }

    } else {
        netNameSlot.push(netData);
    }

    // console.log('netNameSlot', netNameSlot);
    this[netName] = netNameSlot;

    if (await this.save()) {
        // console.log(this[netName]);
        console.log(netName, ' was added/updated to this user');
        return this;
    }
    console.log(netName, ' was not added/updated to this user');
    return false;
}

SocialNetSchema.methods.addLinkedinPageData = async function (netData) {
    console.log('netData', netData);

    let netName = 'linkedin';
    // find all stored nets array with this net name
    let netNameSlot = this[netName] || []; // for update or create model
    // console.log('netNameSlot', netNameSlot);

    if (netNameSlot) {
        // check if exist the one net from array with this name and id 
        let existedNet = netNameSlot.find(item => item.id == netData.id);
        // console.log('netData.id', netData.id);
        console.log('existedNet', existedNet ? true : false);

        // push netData for new model or if the net isn`t exist
        if (existedNet == undefined) {
            // console.log('this[netName]', this[netName]);
            netNameSlot.push(netData);
        } else {
            // replace netData for one existed net in stored nets array
            let updatedNetNameSlot = [];
            for (item of netNameSlot) {
                if (item.id == netData.id) {
                    console.log("TCL: ------------- push netData")
                    updatedNetNameSlot.push(netData);
                } else {
                    console.log("TCL: ------------- push item")
                    updatedNetNameSlot.push(item);
                }
            }
            netNameSlot = updatedNetNameSlot;
        }

    } else {
        netNameSlot.push(netData);
    }

    // console.log('netNameSlot', netNameSlot);
    this[netName] = netNameSlot;

    if (await this.save()) {
        // console.log(this[netName]);
        console.log(netName, ' was added/updated to this user');
        return this;
    }
    console.log(netName, ' was not added/updated to this user');
    return false;
}

// removeSocialNetData
SocialNetSchema.methods.removeSocialNetData = async function (netName, netId) {
    console.log("TCL: removeSocialNetData-----------------")
    let netNameSlot = this[netName];
    let newNetNameSlot = [];
    // console.log('netNameSlot before', netNameSlot);
    // netNameSlot = netNameSlot.filter(element => element.id != netId);
    // console.log('newNetNameSlot after', netNameSlot);

    for (const net of netNameSlot) {
        if (net.id != netId) {
            // store net
            newNetNameSlot.push(net);
        } else {
            // remove the net from all unpablished sheduled posts for the user and from this model
            let scheduledPosts = await SchedulePosts.find({
                userID: this.userID,
                publishStatus: 'unpublished',
                nets: {
                    $elemMatch: {
                        netId: netId,
                    }
                }
            })
            console.log("TCL: involved scheduledPosts", scheduledPosts.length)

            for (const scheduledPost of scheduledPosts) {
                await scheduledPost.removeNetByNameAndId(netName, netId);
            }
        }
    }

    this[netName] = newNetNameSlot;
    // console.log("TCL: SocialNetSchema.methods.removeSocialNetData -> newNetNameSlot", newNetNameSlot)

    if (await this.save()) {
        console.log(netName, ' was removed from this user');
        return true;
    }
    console.log(netName, ' was not removed from this user');
    return false;
}

// map single social net array
let getResponseArrayForNet = function (model, netName) {
    let response = [];
    for (let i = 0; i < model[netName].length; i++) {
        if (netName == 'facebook' && model[netName][i].type == 'user') continue; // skip user accounts in facebook
        response.push(model[netName][i].profile);
    }
    return response;
};


// get array for web views
SocialNetSchema.methods.getResponseForWeb = function () {
    let twitter, facebook, pinterest, tumblr, linkedin, instagram = [];

    if (this.twitter) {
        twitter = getResponseArrayForNet(this, 'twitter');
    }
    if (this.facebook) {
        facebook = getResponseArrayForNet(this, 'facebook');
    }
    if (this.pinterest) {
        pinterest = getResponseArrayForNet(this, 'pinterest');
    }
    if (this.tumblr) {
        tumblr = getResponseArrayForNet(this, 'tumblr');
    }
    if (this.linkedin) {
        linkedin = getResponseArrayForNet(this, 'linkedin');
    }
    if (this.instagram) {
        instagram = getResponseArrayForNet(this, 'instagram');
    }

    let response = {
        id: this.id,
        userID: this.userID,

        twitter: twitter,
        facebook: facebook,
        pinterest: pinterest,
        tumblr: tumblr,
        linkedin: linkedin,
        instagram: instagram,

        createdAt: this.createdAt,
    };

    return response;
}


// getNetDataByNameAndId
SocialNetSchema.methods.getNetDataByNameAndId = function (netName, netId) {
    if (!this[netName]) return false;
    let netData = this[netName].filter((item) => {
        // console.log("TCL: item.id", item.id)
        if (item.id == netId) return item;
    })[0]
    // console.log("TCL: netData", netData)
    return netData;
}


// getNetTypeByNameAndId
SocialNetSchema.methods.getNetTypeByNameAndId = function (netName, netId) {
    if (!this[netName]) return false;
    let netData = this.getNetDataByNameAndId(netName, netId);
    // console.log("TCL: netData", netData)
    return netData ? netData.type : null;
}


// getTokenByNetNameAndId
SocialNetSchema.methods.getTokensByNetNameAndId = function (netName, netId) {
    if (!this[netName]) return false;
    let netData = this.getNetDataByNameAndId(netName, netId);
    // console.log("TCL: netData", netData)
    if (!netData) return null;

    let token, secret, username, password = null;
    switch (netName) {
        case 'twitter':
        case 'tumblr':
            token = netData['token'];
            secret = netData['tokenSecret'];
            break;
        case 'instagram':
            token = netData['accessToken'];
            secret = netData['refreshToken'];
            username = netData['login'];
            password = cryptor.decrypt(netData['password']);
            break;
        default:
            token = netData['accessToken'];
            secret = netData['secretToken'];
            break;
    };
    return {
        accessToken: token,
        secretToken: secret,
        username: username,
        password: password,
    };
}


const SocialNets = mongoose.model('SocialNet', SocialNetSchema);
module.exports = SocialNets;