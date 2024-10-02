import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor () {
    // Create a Redis client
    this.client = redis.createClient({
      host: '127.0.0.1', // Ensure the correct Redis host and port
      port: 6379
    });

    // Log any errors on the Redis client
    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    // Promisify Redis functions to use async/await
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  /**
     * Check if the Redis client is connected and alive.
     * @returns {boolean} true if connected, false otherwise.
     */
  isAlive () {
    return this.client.connected;
  }

  /**
     * Get the value of a key from Redis.
     * @param {string} key - The key to retrieve.
     * @returns {Promise<string|null>} The value of the key, or null if not found.
     */
  async get (key) {
    return this.getAsync(key);
  }

  /**
     * Set a key-value pair in Redis with an expiration time.
     * @param {string} key - The key to set.
     * @param {string|number} value - The value to set.
     * @param {number} duration - The expiration time in seconds.
     * @returns {Promise<void>}
     */
  async set (key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  /**
     * Delete a key from Redis.
     * @param {string} key - The key to delete.
     * @returns {Promise<void>}
     */
  async del (key) {
    await this.delAsync(key);
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
