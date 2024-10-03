/**
 * This file defines the routes for the application.
 * It includes endpoints for user management, authentication,
 * and file operations such as upload, retrieval, listing, 
 * publishing/unpublishing, and fetching file content.
 */
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

// Existing endpoints
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FilesController.postUpload);

// New endpoints for retrieving and listing files
<<<<<<< HEAD
router.get('/files/:id', FilesController.getShow); // GET /files/:id to retrieve a specific file
router.get('/files', FilesController.getIndex); // GET /files for listing all files with pagination
=======
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);
>>>>>>> 14230849dbded9cb3eeb8db559f0456884985dc4

export default router;
