import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController'; // Import FilesController

const router = express.Router();

// Existing endpoints
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew); // User creation
router.get('/connect', AuthController.getConnect); // User authentication
router.get('/disconnect', AuthController.getDisconnect); // User disconnection
router.get('/users/me', UsersController.getMe); // Retrieve user info

// New endpoint for file upload
router.post('/files', FilesController.postUpload); // POST /files for uploading files

export default router;
