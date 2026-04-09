const Redis = require('ioredis');

let redisClient = null;

/**
 * Creates an ioredis client only when REDIS_URL is provided.
 * If Redis is unavailable the server continues without caching.
 */
const connectRedis = () => {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️   REDIS_URL not set — Redis disabled');
    return null;
  }

  const client = new Redis(process.env.REDIS_URL, {
    // Disable default retry strategy so missing Redis doesn't block startup
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: false,
  });

  client.on('connect', () => console.log('✅  Redis connected'));
  client.on('error', (err) => console.error('⚠️   Redis error:', err.message));

  client.connect().catch(() => {
    console.warn('⚠️   Redis unavailable — continuing without cache');
  });

  redisClient = client;
  return client;
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
