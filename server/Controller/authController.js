const refreshTokenApi = require('../Middleware/refreshToken');
const AuthController = {};

AuthController.getNewAccessToken = async (req, res, next) => {
    await refreshTokenApi.generateRefreshToken(req, res);
};

module.exports = AuthController;