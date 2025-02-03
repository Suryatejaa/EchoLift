const PostApi = require('../Apis/Post.api');
const Post = require('../Models/Posts');
const PostController = {};

PostController.createPost = async (req, res, next) => {
    await PostApi.createPost(req, res);
};

PostController.getPost = async (req, res, next) => {
    await PostApi.getPost(req, res);
};

PostController.updatePost = async (req, res, next) => {
    await PostApi.updatePost(req, res);
};

PostController.deletePost = async (req, res, next) => {
    await PostApi.deletePost(req, res);
};

PostController.applyToPromotion = async (req, res, next) => {
    await PostApi.applyToPromotion(req, res);
};

PostController.withdrawApplication = async (req, res, next) => {
    await PostApi.withdrawApplication(req, res);
};

PostController.bookmarkPost = async (req, res, next) => {
    await PostApi.bookmarkPost(req, res);
};

PostController.unbookmarkPost = async (req, res, next) => {
    await PostApi.unbookmarkPost(req, res);
};

PostController.likePost = async (req, res, next) => {
    await PostApi.likePost(req, res);
};

PostController.removeLikeFromPost = async (req, res, next) => {
    await PostApi.removeLikeFromPost(req, res);
};

PostController.trackPostAnalytics = async (req, res, next) => {
    await PostApi.trackPostAnalytics(req, res);
};

PostController.approveApplication = async (req, res, next) => {
    await PostApi.approveApplication(req, res);
};

PostController.approveSubmission = async (req, res, next) => {
    await PostApi.approveSubmission(req, res);
}

module.exports = PostController;