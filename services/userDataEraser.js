const Articles = require('../models/Articles');
const Bitly = require('../models//Bitly');
const FacebookPages = require('../models/FacebookPages');
const Favourites = require('../models/Favourites');
const Feedly = require('../models/Feedly');
const JVzooInfo = require('../models/JVzooInfo');
const JVzooLog = require('../models/JVzooLog');
const Keyword = require('../models/Keyword');
const Payment = require('../models/Payment');
const PocketTokens = require('../models/PocketTokens');
const RssFeeds = require('../models/RssFeeds');
const RssSources = require('../models/RssSources');
const SchedulePosts = require('../models/SchedulePosts');
const SocialArticles = require('../models/SocialArticles');
const SocialNets = require('../models/SocialNets');
const SpinRewriter = require('../models/SpinRewriter');
const StripeInfo = require('../models/StripeInfo');
const Task = require('../models/Task');
const UserActivity = require('../models/UserActivity');
const WarriorPlusInfo = require('../models/WarriorPlusInfo');
const WordAi = require('../models/WordAi');
const User = require('../models/User');
const FoundImages = require('../models/FoundImages');


module.exports.deleteAllForUser = async function (user) {
    if (user == null || !user instanceof User) {
        return false;
    }
    await FoundImages.deleteMany({
        userID: user.id
    });
    await Articles.deleteMany({
        userID: user.id
    });
    await Bitly.deleteMany({
        userID: user.id
    });
    await FacebookPages.deleteMany({
        userID: user.id
    });
    await Favourites.deleteMany({
        userID: user.id
    });
    await Feedly.deleteMany({
        userID: user.id
    });
    await JVzooInfo.deleteMany({
        userID: user.id
    });
    await JVzooLog.deleteMany({
        userID: user.id
    });
    await Keyword.deleteMany({
        userID: user.id
    });
    await Payment.deleteMany({
        userID: user.id
    });
    await PocketTokens.deleteMany({
        userID: user.id
    });
    await RssFeeds.deleteMany({
        userID: user.id
    });
    await RssSources.deleteMany({
        userID: user.id
    });
    // remove SchedulePosts media
    let schedulePostsModels = await SchedulePosts.find();
    for (let i = 0; i < schedulePostsModels; i++) {
        schedulePostsModels[i].deleteMedia();
    }
    await SchedulePosts.deleteMany({
        userID: user.id
    });
    await SocialArticles.deleteMany({
        userID: user.id
    });
    await SocialNets.deleteMany({
        userID: user.id
    });
    await SpinRewriter.deleteMany({
        userID: user.id
    });
    if (user.paymentMethod == 'stripe') {
        await StripeInfo.deleteOne({
            userID: user.id
        });
    }
    await Task.deleteMany({
        userID: user.id
    });
    await UserActivity.deleteMany({
        userID: user.id
    });
    await WarriorPlusInfo.deleteMany({
        userID: user.id
    });
    await WordAi.deleteMany({
        userID: user.id
    });
    await User.deleteOne({
        _id: user.id
    });

    return true;
}