const profileApi = require('../Apis/Profile.api');
const ProfileController = {};

ProfileController.getProfile = async (req, res, next) => {  
    await profileApi.getProfile(req, res);
};
ProfileController.updateProfile = async (req, res, next) => {       
    await profileApi.updateProfile(req, res);
};
ProfileController.followUser = async (req, res, next) => {       
    await profileApi.followUser(req, res);
};
ProfileController.unfollowUser = async (req, res, next) => {       
    await profileApi.unfollowUser(req, res);
};

module.exports = ProfileController;