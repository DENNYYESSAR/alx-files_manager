import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class UsersController {
  /**
   * Retrieve the user based on the token used.
   */
  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user ID from Redis based on the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the user in the database
    const user = await dbClient.db.collection('users').findOne({ _id: dbClient.getObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return the user's email and ID
    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;
