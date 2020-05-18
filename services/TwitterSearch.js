const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8').trim());
const Twitter = require('twitter');
const {
    getTwitterBearerToken
} = require('../helpers/twitterHelper');

async function getTweetsByWord(queryWord) {
    console.log("TCL: queryWord", queryWord)

    const client = new Twitter({
        consumer_key: CONFIG.TwitterKeys.TWITTER_CONSUMER_KEY,
        consumer_secret: CONFIG.TwitterKeys.TWITTER_CONSUMER_SECRET,
        bearer_token: await getTwitterBearerToken(),
    });

    let tweets = await client.get('search/tweets', {
            q: queryWord,
            // result_type: 'popular',
            count: 100,
            filter: 'images',
            include_entities: true,
        })
        .catch(err => {
            console.log("TCL: err", err)
            return false;
        });

    console.log("TCL: tweets length", tweets ? tweets.statuses.length : undefined)
    return tweets ? tweets.statuses : null;
}


async function searchByWord(queryWord) {
    let tweets = await getTweetsByWord(queryWord);
    let mapData = await mapDataFromTweets(tweets);
    console.log("TCL: searchByWord -> mapData.length", mapData ? mapData.length : undefined);
    return mapData;
}


async function mapDataFromTweets(tweets) {
    if (tweets == null) {
        return null;
    }

    let mapData = [];
    let rtMediaCount = 0; // photo from retweeted_status.entities.media[0].media_url
    let videoMediaCount = 0; // preview photo from extended_entities.media[0].video_info.variants
    let photoMediaCount = 0; // photo from entities.media[0].media_url
    let hMediaCount = 0; // photo from html page of user status

    for (let i = 0; i < tweets.length; i++) {
        let name = tweets[i].user.name;
        let userIdString = tweets[i].user.screen_name;
        let commentsCount = parseInt(tweets[i].entities.user_mentions.length);
        let sharesCount = parseInt(tweets[i].retweet_count);
        let likesCount = parseInt(tweets[i].favorite_count);
        let postUrl = `https://twitter.com/${userIdString}/status/${tweets[i].id_str}`;
        let retweetedStatus = tweets[i].retweeted_status;

        // get media
        let mimeType = 'image';
        let mediaUrl = null;

        // try to get video from extended_entities.media[0].video_info.variants
        let videoUrl = tweets[i].extended_entities;
        if (videoUrl && videoUrl.media && videoUrl.media[0] && videoUrl.media[0].video_info && videoUrl.media[0].video_info.variants) {
            mimeType = 'video';
            // mediaUrl = videoUrl.media[0].video_info.variants[0].url;
            // get preview
            mediaUrl = tweets[i].entities.media;
            mediaUrl = mediaUrl ? mediaUrl[0].media_url : null;
            if (mediaUrl) videoMediaCount++;
        }
        // try to get photo from retweeted_status.entities.media[0].media_url
        else if (retweetedStatus && retweetedStatus.entities && retweetedStatus.entities.media && retweetedStatus.entities.media[0]) {
            mediaUrl = retweetedStatus.entities.media[0].media_url;
            if (mediaUrl) rtMediaCount++;
        }
        // try to get photo from entities.media[0].media_url
        else if (tweets[i].entities.media && tweets[i].entities.media[0] && tweets[i].entities.media[0].media_url) {
            mediaUrl = tweets[i].entities.media[0].media_url;
            if (mediaUrl) photoMediaCount++;
        }
        // try to get photo from html page of user status
        else {
            // mediaUrl = await fetchPhotoFromTweetPost(postUrl);
            // mediaUrl = await fetchPhotoFromTweetPostOverChrome(postUrl);
            if (mediaUrl) hMediaCount++;
        }

        mapData.push({
            name: name,
            date: new Date(tweets[i].created_at).getTime() / 1000,
            post_url: postUrl,
            comments: commentsCount,
            shares: sharesCount,
            likes: likesCount,
            text: tweets[i].text,
            photo_url: mediaUrl,
            hashtags: tweets[i].entities.hashtags.map(value => '#' + value.text),
            engagement: commentsCount + sharesCount + likesCount,
            mimeType: mimeType,
            userData: {
                name: name,
                avatar: tweets[i].user.profile_image_url,
                profile_url: `https://twitter.com/${userIdString}`,
            },
            network: 'twitter',
        });
    }

    console.log("mapDataFromTweets -> rtMediaCount", rtMediaCount)
    console.log("mapDataFromTweets -> videoMediaCount", videoMediaCount)
    console.log("mapDataFromTweets -> photoMediaCount", photoMediaCount)
    console.log("mapDataFromTweets -> hMediaCount", hMediaCount)

    return mapData && mapData.length ? mapData : null;
}


function fetchPhotoFromTweetPost(url) {
    return new Promise(async (resolve, reject) => {
        // const axios = require('axios');
        // let html = await axios({
        //         method: 'get',
        //         url: url,
        //     })
        //     .catch(err => {
        //         console.log("fetchPhotoFromTweetPost -> err.response.data", err.response.data)
        //         console.log("fetchPhotoFromTweetPost -> err.message", err.message)
        //     });
        const request = require('request-promise');
        let options = {
            uri: url,
            resolveWithFullResponse: true
        }

        let html = await request(options)
            .catch(err => {
                console.log("fetchPhotoFromTweetPost -> err.message", err.message)
                resolve(null);
            });

        if (html && html.body) {
            let mediaUrl = html.body.match(/src=(.+?[\.jpg|\.gif|\.png]")/);
            // console.log("fetchPhotoFromTweetStatusUrl -> mediaUrl[0]", mediaUrl ? mediaUrl[0] : null)
            // console.log("fetchPhotoFromTweetStatusUrl -> mediaUrl[1]", mediaUrl ? mediaUrl[1] : null)
            // console.log("fetchPhotoFromTweetStatusUrl -> mediaUrl[2]", mediaUrl ? mediaUrl[2] : null)
            resolve(mediaUrl ? mediaUrl[1].slice(1, -1) : null);

        } else {
            resolve(null);
        }
    });
}

function fetchPhotoFromTweetPostOverChrome(url) {
    return new Promise(async (resolve, reject) => {
        let page = await require('../services/puppeteerBrowser').getNewPage();
        await page.goto(url);

        // enter credentials
        // let usernameField = '#react-root > section > main > article > div > div > div > form > div:nth-child(4) > div > label > input';
        // div > img
        // document.querySelector("#react-root > div > div > div > main > div > div > div > div.css-1dbjc4n.r-14lw9ot.r-1tlfku8.r-1ljd8xs.r-13l2t4g.r-1phboty.r-1jgb5lz.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div > div > section > div > div > div > div:nth-child(2) > div > article > div > div:nth-child(2) > div.css-1dbjc4n.r-1iusvr4.r-16y2uox.r-1777fci.r-5f2r5o.r-1mi0q7o > div:nth-child(3) > div > div > div > a > div > div.r-1p0dtai.r-1pi2tsx.r-1d2f490.r-u8s1d.r-ipm5af.r-13qz1uu > div > img")
        // let imageSel = 'img [alt="Image"]';
        let imageSel = 'img';
        // await page.waitForSelector(imageSel);
        await page.waitFor(400);
        let image = await page.$(imageSel);
        console.log("fetchPhotoFromTweetPostOverChrome -> image", image)

        const imageUrl = await page.evaluate(() =>
            document.querySelector("img") // image selector
        );
        console.log("fetchPhotoFromTweetPostOverChrome -> imageUrl", imageUrl)

        resolve(null);

        // // check login success   
        // let loginRes = await page.waitForResponse('https://www.instagram.com/accounts/login/ajax/', {
        //         timeout: 4000
        //     })
        //     .catch(err => {
        //         console.log("TCL: login response err", err)
        //     });
        // loginRes = loginRes ? await loginRes.json('') : null;
        // console.log("TCL: loginRes ->", loginRes)
        // console.log("TCL: loginOverPuppeteer -> page.url()", page.url())

        // if (loginRes && loginRes.authenticated == true) {
        //     await page.close();
        //     resolve mediaUrl;

        // } else {
        //     await page.close();
        //     resolve(null);
        // }
    });
}

module.exports.getTweetsByWord = getTweetsByWord;
module.exports.searchByWord = searchByWord;