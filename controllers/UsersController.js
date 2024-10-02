import crypto from 'crypto'; // For SHA1 hashing
import dbClient from '../utils/db.js';

class UsersController {
  /**
     * Creates a new user
     */
  static async postNew (req, res) {
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
  }
}

export default UsersController;
