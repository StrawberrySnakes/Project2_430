// index.js middleware
// Keep this page that deal with login, possible add more functionality if necessary. 

// This is where we will check if the user is logged in or not and redirect them to the appropriate page. 
// We will also check if the user is trying to access a page that requires login and redirect them to the login page
//  if they are not logged in. We will also check if the user is trying to access a page that requires
//  logout and redirect them to the maker page if they are logged in. 
// We will also check if the user is trying to access a page that requires secure connection and redirect 
// them to the secure version of the page if they are not using a secure connection.
const requiresLogin = (req, res, next) => {
    if (!req.session.account) {
        return res.redirect('/');
    }
    return next();
};

const requiresLogout = (req, res, next) => {
    if (req.session.account) {
        return res.redirect('/app');
    }
    return next();
};

const requiresSecure = (req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.hostname}${req.url}`);
    }
    return next();
};

const bypassSecure = (req, res, next) => {
    next();
};

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

if(process.env.NODE_ENV === 'production') {
    module.exports.requiresSecure = requiresSecure;
} else {
    module.exports.requiresSecure = bypassSecure;
}