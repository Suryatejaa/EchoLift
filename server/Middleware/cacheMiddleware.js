const redisClient = require('../utils/redisClient');

const cacheMiddleware = (req, res, next) => {
    const key = req.originalUrl || req.url;

    try{
        const cachedData = await redisClient.get(key);
        if(cachedData){
            return res.status(200).json(JSON.parse(cachedData));
        }
        next();

    }catch(error){
        console.error('Error in cache middleware:', error);
        next();
    }
}

module.exports = cacheMiddleware;