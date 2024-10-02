import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { promisify } from 'util';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Promisify file system methods for easier async usage
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

class FilesController {
  /**
   * POST /files
   * Creates a new file document in the database and optionally saves the file on disk.
   */
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    // Validate parentId
    let parentFile = null;
    if (parentId !== 0) {
      try {
        parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId), userId });
        if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
      } catch (error) {
        return res.status(400).json({ error: 'Invalid parentId' });
      }
    }

    // Prepare file document
    const fileDocument = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : ObjectId(parentId),
    };

    // Handle folder creation
    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId: fileDocument.parentId,
      });
    }

    // Handle file or image creation
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = `${folderPath}/${uuidv4()}`;

    // Ensure the directory exists
    try {
      await mkdir(folderPath, { recursive: true });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to create directory' });
    }

    // Write the file to disk
    try {
      const decodedData = Buffer.from(data, 'base64');
      await writeFile(localPath, decodedData);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save file' });
    }

    // Add localPath to the document and save to database
    fileDocument.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(fileDocument);

    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId: fileDocument.parentId,
      localPath,
    });
  }

  /**
   * GET /files/:id
   * Retrieve a file document based on its ID.
   */
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    // Retrieve the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the file document in the database
    let fileDocument;
    try {
      fileDocument = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(fileId),
        userId,
      });
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(fileDocument);
  }

  /**
   * GET /files
   * Retrieve all file documents for a specific parentId with pagination.
   */
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    
    // Retrieve the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Set parentId and pagination
    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const limit = 20;
    const skip = page * limit;

    const query = { userId, parentId };

    // Query the database for files under the parentId
    try {
      const files = await dbClient.db.collection('files')
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.status(200).json(files);
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching files' });
    }
  }
}

export default FilesController;
