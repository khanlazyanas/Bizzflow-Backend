import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error:', err));

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
        console.log("Redis Connected Successfully! ⚡");
    } catch (error) {
        console.error("Redis Connection Failed:", error);
    }
})();

export default redisClient;