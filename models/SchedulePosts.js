const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fs = require('fs');

const SchedulePostSchema = new Schema({
    userID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    articleType: {
        // rss article, social artical, user article (on front is 'draft')
        type: String,
        enum: ['rss', 'social', 'user'],
        default: 'user',
    },
    message: {
        type: String,
    },
    usedBitly: {
        type: Boolean,
    },
    nets: {
        type: Array,
        required: false,
        attributes: {
            netName: {
                type: String,
                require: false,
            },
            netId: {
                type: String,
                require: false,
            },
            publishedPostID: {
                type: String,
                require: false,
            },
            publishStatus: {
                type: String,
                enum: ['scheduled', 'published', 'errors'],
                default: 'scheduled',
            },
            errors: {
                type: Object,
                default: null,
            }
        }
    },
    originalUrl: {
        type: String,
    },
    images: {
        type: Array,
    },
    videos: {
        type: Array,
    },
    approveStatus: {
        type: String,
        enum: ['approved', 'unapproved'],
        default: 'unapproved',
    },
    publishTime: {
        // type: Date,
        type: Object,
        required: false,
    },
    publishStatus: {
        type: String,
        enum: ['published', 'unpublished', 'errors'],
        default: 'unpublished',
    },
    postNow: {
        type: Boolean,
        default: false,
    },
    hideInReview: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});


// findOneOrCreate
SchedulePostSchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
    const one = await this.findOne(condition);
    return one || this.create(doc);
});


SchedulePostSchema.methods.isReadyToPublishing = function () {
    if (this.approveStatus == 'approved' && this.nets.length != 0 && this.publishTime) {
        return true;
    } else return false;
}


SchedulePostSchema.methods.deleteMedia = function () {
    try {
        for (let i = 0; i < this.images.length; i++) {
            fs.unlinkSync(this.images[i].path);
        }
        for (let i = 0; i < this.videos.length; i++) {
            fs.unlinkSync(this.videos[i].path);
        }
        return true;

    } catch (error) {
        console.log("TCL: SchedulePostSchema.methods.deleteMedia -> error", error)
        return false;
    }
}


SchedulePostSchema.methods.setPublishStatusForNetNameAndId = function (name, id, value) {
    let index = this.nets.findIndex(item => {
        if (item.netName == name && item.netId == id) return true;
    });
    if (index == -1) return false;

    this.nets.set(index, {
        netName: this.nets[index].netName,
        netId: this.nets[index].netId,
        publishedPostID: this.nets[index].publishedPostID,
        publishStatus: value,
        errors: this.nets[index].errors,
    });

    return true;
}


SchedulePostSchema.methods.setPublishErrorsForNetNameAndId = function (name, id, errors) {
    let index = this.nets.findIndex(item => {
        if (item.netName == name && item.netId == id) return true;
    });
    if (index == -1) return false;

    this.nets.set(index, {
        netName: this.nets[index].netName,
        netId: this.nets[index].netId,
        publishedPostID: this.nets[index].publishedPostID,
        publishStatus: this.nets[index].publishStatus,
        errors: errors,
    });

    return true;
}


SchedulePostSchema.methods.setPublishedPostIDForNetNameAndId = function (name, id, value) {
    let index = this.nets.findIndex(item => {
        if (item.netName == name && item.netId == id) return true;
    });
    if (index == -1) return false;

    this.nets.set(index, {
        netName: this.nets[index].netName,
        netId: this.nets[index].netId,
        publishedPostID: value,
        publishStatus: this.nets[index].publishStatus,
        errors: this.nets[index].errors,
    });

    return true;
}


SchedulePostSchema.methods.getPostedIDForNetNameAndId = function (name, id) {
    let index = this.nets.findIndex(item => {
        if (item.netName == name && item.netId == id) return true;
    });
    if (index == -1) return false;

    return this.nets[index].publishStatus == 'published' ? this.nets[index].publishedPostID : null;
}


SchedulePostSchema.methods.removeNetByNameAndId = async function (name, id) {
    // get
    let nets = this.nets;

    // filter nets array
    // console.log('nets before', nets);
    nets = nets.filter(element => {
        if (element.netName != name || element.netId != id) return element;
    });
    // console.log('nets after', nets);

    // set
    this.nets = nets;

    // save
    await this.save()
        .catch(err => {
            console.log("TCL: SchedulePostSchema.methods.removeNetById -> err", err)
            return false;
        });

    // if the nets is empty remove the model
    if (!this.nets || this.nets.length == 0) {
        await this.remove();
        console.log("TCL: sheduled post was removed")
        return true;
    }
    console.log("TCL: sheduled post was updated")
    return this;
}


const SchedulePost = mongoose.model('SchedulePost', SchedulePostSchema);
module.exports = SchedulePost;