const mongoose = require('mongoose');

const MessagesSchema = mongoose.Schema({
    userCreated: {
        type: String
    },
    text: {
        type: String
    },
    label: {
        type: String,
        enum: ['tick', 'exclamation', 'new', 'fix' ,'improvement'],
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Messages = mongoose.model('Messages', MessagesSchema);

module.exports = Messages;