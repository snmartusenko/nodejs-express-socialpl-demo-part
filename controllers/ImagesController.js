const fs = require("fs");
const CONFIG = JSON.parse(fs.readFileSync("config.json", "utf8").trim());
const url = require('url');
const PixabayHelper = require('../helpers/pixabay');
const FoundImages = require('../models/FoundImages');
const paginate = require('paginate-array');
const UserActivity = require('../models/UserActivity');


module.exports.index = async function (req, res) {
    console.log('image_index');

    return res.render('panels/images/index.ejs', {
        title: "Creative Search",
        user: req.user,
        AppName: CONFIG.AppName,
    });
}


module.exports.api_search = async function (req, res) {
    console.log("TCL: api_search")

    // // for testing
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: 5cee78766f68d655c422d890");
    // }

    let queryWord = req.query.q;
    console.log("TCL: req.query", req.query)
    if (!queryWord) return res.json([]);
    let pageNumber = parseInt(req.query.pageNumber);
    let pageSize = parseInt(req.query.pageSize);

    // get images from Pixabay
    let cloudData = await PixabayHelper.fetchImagesForWord(queryWord);

    // transform of cloud images data to FoundImages model format
    let tCloudImages = new Array(cloudData.length);
    for (let i = 0; i < cloudData.length; i++) {
        tCloudImages[i] = {
            userID: [req.user.id],
            queryWord: queryWord,
            imageData: cloudData[i],
        };
    }

    let storedImages = await FoundImages.find({
        userID: req.user.id,
        queryWord: queryWord,
    });
    // console.log("TCL: storedImages.length", storedImages.length)

    // delete duplicate with stored
    tCloudImages = await tCloudImages.filter(image => {
        // find pageURL in stored
        let duplicate = storedImages.find(item => item.imageData.pageURL == image.imageData.pageURL);
        if (duplicate == undefined) {
            // keep/add image
            return image;
        }
    });
    // console.log("TCL: after tCloudImages.length", tCloudImages.length)

    let images = tCloudImages.concat(storedImages);
    console.log("TCL: images.length", images.length)

    let isNewSearch = function () {
        // get previousSearchWord
        let previousSearchWord;
        if (req.headers.referer != null) {
            let refQuery = url.parse(req.headers.referer, {
                parseQueryString: true
            }).query;

            previousSearchWord = refQuery ? refQuery.query : undefined;
        }
        // console.log("TCL: isNewSearch -> previousSearchWord", previousSearchWord)
        // console.log("TCL: isNewSearch -> queryWord", queryWord)

        // user makes the same search
        if (previousSearchWord && previousSearchWord == queryWord) {
            console.log("TCL: isNewSearch -> ", false);
            return false;

        } else {
            console.log("TCL: isNewSearch -> ", true);
            return true;
        }
    }

    // log
    if (isNewSearch()) UserActivity.logImageSearchCompleting(req.user.id, queryWord);

    // paginate
    return res.json(images ? paginate(images, pageNumber || 1, pageSize || 10) : []);
}


module.exports.api_setFavorite = async function (req, res) {
    console.log("TCL: api_setFavorite")

    // // for testing
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: 5cee78766f68d655c422d890");
    // }

    let image = JSON.parse(JSON.stringify(req.body));
    if (!image || !image.queryWord || !image.imageData || !image.imageData.pageURL) return res.sendStatus(400);

    // override userID
    image.userID = req.user.id;

    let model = await FoundImages.findOneOrCreate({
        userID: req.user.id,
        "imageData.pageURL": image.imageData.pageURL,
    }, image);

    model.isFavorite = true;

    if (await model.save()) {
        // log
        UserActivity.logImageFavoritesAddings(req.user.id, image.queryWord, model);
        return res.json(model);
    } else {
        return res.sendStatus(500);
    }
}


module.exports.api_getFavorites = async function (req, res) {
    console.log("TCL: api_getFavorites")

    // // for testing
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: 5cee78766f68d655c422d890");
    // }

    let models = await FoundImages.find()
        .where({
            userID: req.user.id,
            isFavorite: true
        })

    return res.json(models ? models : []);
}


module.exports.api_unsetFavorite = async function (req, res) {
    console.log("TCL: api_unsetFavorite")

    // // for testing
    // if (!req.user) req.user = {};
    // if (!req.user.id) {
    //     req.user.id = '5cee78766f68d655c422d890';
    //     console.log("TCL: 5cee78766f68d655c422d890");
    // }

    let image = JSON.parse(JSON.stringify(req.body));
    if (!image || !image.imageData || !image.imageData.pageURL) return res.sendStatus(400);

    // find by pageURL
    let model = await FoundImages.findOne({
        userID: req.user.id,
        "imageData.pageURL": image.imageData.pageURL,
    });
    if (!model) return res.sendStatus(404);

    model.isFavorite = false;

    if (await model.save()) {
        return res.json(model);
    } else {
        return res.sendStatus(500);
    }
}