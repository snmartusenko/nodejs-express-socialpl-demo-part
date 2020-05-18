// isSubscribed
module.exports = function (req, res, next) {

    // for admin
    if (req.user && req.user.isAdmin) {
        return next();
    }

    if (req.user && req.user.isSubscribeCancelled == true) {
        return res.redirect('/payment');
    } else {
        return next();
    }

}