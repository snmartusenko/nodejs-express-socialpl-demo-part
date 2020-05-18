const fs = require('fs');
const RssSources = require('../models/RssSources');
const RssFeeds = require('../models/RssFeeds');
const parseOpml = require('node-opml-parser');
const request = require('request');


let addRssSource = async (rssSourceData) => {
    let existed = await RssSources.findOne({
        feedUrl: rssSourceData.feedUrl
    });

    if (!existed) {
        // create new
        let model = await RssSources.create(rssSourceData);

        if (await RssFeeds.addRssFromSourceModel(model)) {
            console.log("TCL: addRssSource -> true")
            return model;

        } else {
            model.remove();
            console.log("TCL: addRssSource -> remove")
            return false;
        }

    } else {
        console.log("TCL: addRssSource -> existed")
        return existed;
    }
}

// search in feedly rss sources
module.exports.searchOnlineRssSources = async function (req, res) {
    console.log('searchOnlineRssSources');

    let queryWord = req.query.q;
    if (!queryWord) return res.end(JSON.stringify([]));

    let searchUrl = 'https://cloud.feedly.com/v3/search/feeds/?query=' + queryWord;
    console.log("TCL: queryWord", queryWord);

    request(searchUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log(body);
            // валидация и 
            // обработка полученного ответа, заголовков
            // console.log('body', body);
            return res.end(JSON.stringify(body ? body : []));

        } else {
            console.log('error', error);
            return res.end(JSON.stringify([]));
        }
    })
}


module.exports.create = async function (req, res) {
    let feedUrl = req.body.rss_url;
    // console.log('RssSources add, feedUrl=', feedUrl);
    if (feedUrl) {
        let rssSourceData = {
            userID: req.user.id,
            title: feedUrl,
            feedUrl: feedUrl,
        };

        addRssSource(rssSourceData);
    }
    return res.redirect('/dashboard/settings');
}


module.exports.remove = async function (req, res) {
    RssSources.findOneAndDelete({
            _id: req.params.id
        })
        .exec(function (err, model) {
            if (!model) return res.sendStatus(404);
            if (err) return res.send(err);

            return res.redirect('/dashboard/settings');
        });
}


module.exports.import_opml = function (req, res) {
    if (req.file) {
        let xmlString = fs.readFileSync(req.file.path).toString();
        parseOpml(xmlString, (err, items) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }
            // items is a flat array of all items in opml
            // console.log('items', items);

            // add userID into rss source items
            for (let i = 0; i < items.length; i++) {
                items[i].userID = req.user.id;
                addRssSource(items[i]);
            }
        });
    }
    return res.redirect('/dashboard/settings');
}