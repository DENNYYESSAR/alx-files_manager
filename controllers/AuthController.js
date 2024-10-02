import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * AuthController manages user authentication.
 */
class AuthController {
  /**
   * Sign-in the user by generating a new authentication token.
   */
  static async getConnect (req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    // Hash the password using SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Find the user by email and hashed password
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a token and store it in Redis for 24 hours
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, String(user._id), 60 * 60 * 24);

    return res.status(200).json({ token });
  }

  /**
   * Sign-out the user by deleting their authentication token.
   */
  static async getDisconnect (req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the token from Redis
    await redisClient.del(key);
    return res.status(204).send();
  }
}

export default AuthController;
