const FeedApi = require('../Apis/Feed.api');
const FeedContrtoller = {};

FeedContrtoller.getForYouFeed = async (req, res, next) => {
    await FeedApi.getForYouFeed(req, res);
};
FeedContrtoller.getFollowingFeed = async (req, res, next) => {
    await FeedApi.getFollowingFeed(req, res);
};
FeedContrtoller.authenticateJWT = async (req, res, next) => {
    await FeedApi.authenticateJWT(req, res);
};
FeedContrtoller.getCurrentUserPosts = async (req, res, next) => {
    await FeedApi.getCurrentUserPosts(req, res);
}
module.exports = FeedContrtoller;