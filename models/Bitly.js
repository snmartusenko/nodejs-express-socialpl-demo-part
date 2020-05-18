const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BitlySchema = new Schema({
    userID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    accessToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    profile: {
        type: Object,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


// findOneOrCreate
BitlySchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
    const one = await this.findOne(condition);
    return one || this.create(doc);
});


BitlySchema.methods.shortenUrl = async function (url) {
    // console.log("TCL: shortenUrl")
    // console.log("TCL: url", url)

    const BitlyClientClass = require('bitly').BitlyClient;
    const bitlyClient = new BitlyClientClass(this.accessToken);

    let short = await bitlyClient
        .shorten(url)
        // .then((res) => res)
        .catch(function (error) {
            console.error(error);
        });
    // console.log("TCL: short", short)
    return short.url;
}


// get array for web views
BitlySchema.methods.getResponseForWeb = function () {
    return {
        id: this.id,
        userID: this.userID,
        profile: this.profile,
        createdAt: this.createdAt,
    };
}


const Bitly = mongoose.model('Bitly', BitlySchema);
module.exports = Bitly;