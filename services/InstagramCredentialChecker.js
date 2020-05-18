const Instagram = require('instagram-nodejs-without-api');
const client = new Instagram();


function loginOverAjax(username, password) {
    return client.getCsrfToken()
        .then(csrf => {
            client.csrfToken = csrf;
            console.log("TCL: login -> client.csrfToken", client.csrfToken)
        })
        .then(() => {
            console.log("TCL: login -> username", username)
            console.log("TCL: login -> password", password)
            return client.auth(username, password)
                .then(sessionId => {
                    console.log("TCL: login -> sessionId", sessionId)
                    // client.sessionId = sessionId;
                    if (sessionId) {
                        // return client.getUserDataByUsername(username);
                        console.log("TCL: login -> sessionId", sessionId)
                        return sessionId;
                    } else {
                        return false;
                    }
                })
        })
        .catch(err => {
            console.log("TCL: login -> err", err)
            return false;
        });
}


async function loginOverWeb(username, password) {
    console.log("TCL: loginOverPuppeteer ------------------------")
    // const browser = await require('../services/puppeteerBrowser').getBrowserInstance();
    // const devices = require('puppeteer/DeviceDescriptors');
    // // const iPhonex = devices['iPhone X'];
    // const android = devices['Nexus 6P'];
    const url = 'https://www.instagram.com/accounts/login/';
    let page = await require('../services/puppeteerBrowser').getNewPage();
    await page.goto(url);

    // let cookie = 'Cookie: mid=XMB4vwALAAFguE9HWY_fvTSlBv7P; fbm_124024574287414=base_domain=.instagram.com; csrftoken=yifLpKyNM8VmAgBEMm3vZzV4erfYxPvR; rur=FTW; urlgen="{\"93.78.206.3\": 25229}:1i2tZM:DJSIdUE28UG1U8fmNiQ0vgRdj3o"';
    let cookie = [{
            "name": "mid",
            "value": "XMB4vwALAAFguE9HWY_fvTSlBv7P",
        },
        // {
        //     "name": "rur",
        //     "value": "FTW",
        // },
        // {
        //     "name": "fbm_124024574287414",
        //     "value": "base_domain='.instagram.com'",
        // },
        // {
        //     "name": "urlgen",
        //     "value": "{\"93.78.206.3\": 25229}:1i2tZM:DJSIdUE28UG1U8fmNiQ0vgRdj3o",
        // },
    ];
    await page.setCookie(...cookie);
    // const cookiesSet = await page.cookies(url);
    // console.log((cookiesSet));  

    // enter credentials
    // let usernameField = '#react-root > section > main > article > div > div > div > form > div:nth-child(4) > div > label > input';
    let usernameField = 'input[type="text"][name="username"]';
    await page.waitForSelector(usernameField);
    await page.type(usernameField, username);
    // let passwordField = '#react-root > section > main > article > div > div > div > form > div:nth-child(5) > div > label > input';
    let passwordField = 'input[type="password"][name="password"]';
    await page.waitForSelector(passwordField);
    await page.type(passwordField, password);

    // click login button
    // let submitButton = '#react-root > section > main > article > div > div > div > form > div:nth-child(7) > button';
    let submitButton = 'button[type="submit"]';
    await page.waitForSelector(submitButton);
    await page.click(submitButton);

    // check login success   
    let loginRes = await page.waitForResponse('https://www.instagram.com/accounts/login/ajax/', {
            timeout: 4000
        })
        .catch(err => {
            console.log("TCL: login response err", err)
        });
    loginRes = loginRes ? await loginRes.json('') : null;
    console.log("TCL: loginRes ->", loginRes)
    console.log("TCL: loginOverPuppeteer -> page.url()", page.url())

    if (loginRes && loginRes.authenticated == true) {
        console.log("TCL: isLogin")
        await page.close();
        return true;

    } else {
        console.log("TCL: loginOverPuppeteer -> login failed with ", username, password)
        await page.close();
        return false;
    }
}


module.exports.check = async function (username, password) {
    let isLoginOverWeb = await loginOverWeb(username, password);
    console.log("TCL: isLoginOverWeb", isLoginOverWeb)
    if (isLoginOverWeb) {
        return true;

    } else {
        let isLoginOverAjax = await loginOverAjax(username, password);
        console.log("TCL: isLoginOverAjax", isLoginOverAjax)
        return isLoginOverAjax ? true : false;
    }
}