import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class AuthController {
  /**
     * Sign in the user by generating a new authentication token.
     */
  static async getConnect (req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract and decode the credentials from the Authorization header
    const base64Credentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = decodedCredentials.split(':');

    // Hash the password using SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Check if the user exists in the database
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a new token (UUID) and store it in Redis
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 24 * 60 * 60); // Expires in 24 hours

    // Return the token to the client
    return res.status(200).json({ token });
  }

  /**
     * Sign out the user by invalidating the authentication token.
     */
  static async getDisconnect (req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user based on the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the token in Redis to sign out the user
    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
