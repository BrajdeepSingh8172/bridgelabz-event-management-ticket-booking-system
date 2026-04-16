const Redis = require('ioredis');

let redisClient = null;

const connectRedis = () => {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️   REDIS_URL not set — Redis disabled');
    return null;
  }

  const client = new Redis(process.env.REDIS_URL, {
    retryStrategy: () => null,      // ← add this line — stops the spam
    maxRetriesPerRequest: 0,        // ← change 3 to 0
    lazyConnect: true,
    enableReadyCheck: false,
    enableOfflineQueue: false,      // ← add this line
  });

  client.on('connect', () => console.log('✅  Redis connected'));
  client.on('error', () => { });     // ← silence the error event, warning already shown below

  client.connect().catch(() => {
    console.warn('⚠️   Redis unavailable — continuing without cache');
    redisClient = null;
  });

  redisClient = client;
  return client;
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };