const UserApi = require('../Apis/User.api');
const User = require('../Models/userSchema');
const UserController = {};

UserController.register = async (req, res, next) => {
    await UserApi.registerUser(req, res);
};
UserController.login = async (req, res, next) => {
    await UserApi.loginUser(req, res);
};
UserController.logout = async (req, res, next) => {
    await UserApi.logoutUser(req, res);
};
UserController.getUser = async (req, res, next) => {
    await UserApi.getUser(req, res);
};

UserController.updateUser = async (req, res, next) => {
    await UserApi.updateUser(req, res);
};
UserController.sendOtp = async (req, res, next) => {
    await UserApi.sendOtp(req, res);
};
UserController.verifyOtp = async (req, res, next) => {
    await UserApi.verifyOtp(req, res);
};

UserController.forgotPasswordRequest = async (req, res, next) => {
    await UserApi.forgotPasswordRequestUser(req, res);
};

UserController.forgotPasswordVerifyOtp = async (req, res, next) => {
    await UserApi.forgotPasswordVerifyOtp(req, res);
};

UserController.forgotPasswordReset = async (req, res, next) => {
    await UserApi.forgotPasswordResetUser(req, res);
};
UserController.passwordResetUser = async (req, res, next) => {
    await UserApi.passwordResetUser(req, res);
};

UserController.checkUsernameAvailability = async (req, res, next) => {
    await UserApi.checkUsernameAvailability(req, res);
};







module.exports = UserController;
