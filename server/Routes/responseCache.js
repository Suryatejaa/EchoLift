const responseCache = (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=600'); // Cache for 10 minutes
    next();
};

module.exports = responseCache;