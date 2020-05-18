// hasUserInRequest
module.exports = function (req, res, next) {

    // console.log('req.isAuthenticated()', req.isAuthenticated());

    if (req.user) {
        if (req.user.isAdmin === true) {
            // console.log('hasAdminInRequest');
            return next();

        } else {
            return res.status(401).send("401 Unauthorized");
        }

    } else {
        return res.redirect('/auth/login');
    }

}