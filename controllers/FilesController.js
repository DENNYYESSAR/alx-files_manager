import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import mime from 'mime-types';
import path from 'path';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class FilesController {
  /**
   * Handles file upload
   */
  static async postUpload(req, res) {
    const token = req.headers['x-token'];

    // Retrieve user from Redis using token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validation of input
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Check parent folder if parentId is provided
    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentId, type: 'folder' });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found or is not a folder' });
      }
    }

    // Handle folder creation
    if (type === 'folder') {
      const newFolder = {
        userId,
        name,
        type,
        isPublic,
        parentId,
      };
      const result = await dbClient.db.collection('files').insertOne(newFolder);
      return res.status(201).json({ id: result.insertedId, userId, name, type, isPublic, parentId });
    }

    // Handle file or image creation
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    await fs.mkdir(folderPath, { recursive: true });
    const fileUUID = uuidv4();
    const filePath = path.join(folderPath, fileUUID);
    const buffer = Buffer.from(data, 'base64');

    try {
      await fs.writeFile(filePath, buffer);
    } catch (error) {
      return res.status(500).json({ error: 'Error writing file to disk' });
    }

    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: filePath,
    };

    const result = await dbClient.db.collection('files').insertOne(newFile);
    return res.status(201).json({ id: result.insertedId, userId, name, type, isPublic, parentId });
  }
}

export default FilesController;
