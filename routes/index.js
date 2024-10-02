import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController'; // Import AuthController

const router = express.Router();

// Existing endpoints
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// New endpoints for user actions
router.post('/users', UsersController.postNew); // POST /users for creating a new user

// New authentication endpoints
router.get('/connect', AuthController.getConnect); // GET /connect for login
router.get('/disconnect', AuthController.getDisconnect); // GET /disconnect for logout
router.get('/users/me', UsersController.getMe); // GET /users/me for retrieving user info

export default router;
