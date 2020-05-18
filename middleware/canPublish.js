var fs = require('fs');
var CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8').trim());
const paymentChecker = require('../utils/paymentChecker');


module.exports = async function (req, res, next) {
    // console.log("TCL: req.user.isAdmin", req.user.isAdmin)
    // console.log("TCL: paymentChecker.userHasJVZooPublishSubscribe()", await paymentChecker.userHasJVZooPublishSubscribe(req.user))
    let userIsJVZooClient = await paymentChecker.userIsJVZooClient(req.user);
    let userHasJVZooSearchSubscribe = await paymentChecker.userHasJVZooSearchSubscribe(req.user);
    let userHasJVZooPublishSubscribe = await paymentChecker.userHasJVZooPublishSubscribe(req.user);

    if (req.user.isAdmin) {
        return next();

        // jvzoo subscribes
    } else if (userIsJVZooClient) {
        if (userHasJVZooPublishSubscribe) {
            return next();
        } else {
            return res.redirect(`http://${CONFIG.MainSiteDomain}/jvzoo2.html`);
        }

        // stripe subscribes
    } else if (req.user.paymentMethod == 'stripe') {
        if (await paymentChecker.getSubscribedPlanNameForUser(req.user)) {
            return next();
        } else {
            return res.redirect('/payment/upgrade');
        }

    } else {
        return res.redirect('/payment/upgrade');
    }
}