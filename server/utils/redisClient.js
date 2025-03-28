const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});
redisClient.on('connect', () => {
    console.log('Redis client connected');
});
redisClient.on('ready', () => {
    console.log('Redis client is ready');
});
redisClient.on('end', () => {
    console.log('Redis client disconnected');
});
redisClient.connect().catch(console.error);

module.exports = redisClient;