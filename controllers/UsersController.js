import crypto from 'crypto'; // For SHA1 hashing
import dbClient from '../utils/db.js'; // Database client
import redisClient from '../utils/redis.js'; // Redis client
import { ObjectId } from 'mongodb'; // Import ObjectId to handle MongoDB IDs

class UsersController {
  /**
   * Creates a new user
   */
  static async postNew (req, res) {
    try {
      const { email, password } = req.body;

      // Check if email is missing
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      // Check if password is missing
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check if the user already exists in the DB
      const userExists = await dbClient.db.collection('users').findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Insert new user into the database
      const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

      // Return the new user with id and email
      return res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      // Catch and return any errors
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Retrieve the user based on the token used.
   */
  static async getMe (req, res) {
    try {
      const token = req.headers['x-token'];

      // Check if token is missing
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user ID from Redis based on the token
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the user in the database using the ObjectId
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return the user's email and ID
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (err) {
      // Catch and return any errors
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;
