import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController'; // Import FilesController

const router = express.Router();

// Existing endpoints
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FilesController.postUpload); // POST /files for uploading files

// New endpoints for retrieving and listing files
router.get('/files/:id', FilesController.getShow);  // GET /files/:id to retrieve a specific file
router.get('/files', FilesController.getIndex);     // GET /files for listing all files with pagination

export default router;
