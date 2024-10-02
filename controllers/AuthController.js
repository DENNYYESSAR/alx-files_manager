import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid'; // For generating random tokens
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class AuthController {
  /**
   * Sign-in a user and generate an authentication token.
   */
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization || '';

    // Decode Base64 of "<email>:<password>"
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Hash the password with SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Find user with email and hashed password
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a random token and store in Redis for 24 hours
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 24 * 60 * 60);

    // Return the token
    return res.status(200).json({ token });
  }

  /**
   * Sign-out a user by deleting the token from Redis.
   */
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if token exists in Redis
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove the token from Redis
    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
