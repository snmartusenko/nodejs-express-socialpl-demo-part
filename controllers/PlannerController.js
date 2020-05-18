const fs = require("fs");
const CONFIG = JSON.parse(fs.readFileSync("config.json", "utf8").trim());
const SocialNets = require('../models/SocialNets');


module.exports.index = async function (req, res) {
    console.log('planner_index');
    
    let socialNets = await SocialNets.findOne({
        userID: req.user.id
    });

    return res.render('panels/planner/index.ejs', {
        title: "Planner",
        user: req.user,
        AppName: CONFIG.AppName,
        socialNets: socialNets ? socialNets.getResponseForWeb() : null,
    });
}