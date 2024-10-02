import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController'; // Import the new UsersController


const router = express.Router();

// Existing endpoints
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// New endpoint for creating users
router.post('/users', UsersController.postNew); // POST /users for creating a new user

export default router;