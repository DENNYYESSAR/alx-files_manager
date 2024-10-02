import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  /**
   * POST /files
   * Creates a new file or folder in the database and locally.
   */
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Retrieve the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    let parentDocument = null;
    if (parentId !== 0) {
      try {
        parentDocument = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
        if (!parentDocument) return res.status(400).json({ error: 'Parent not found' });
        if (parentDocument.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
      } catch (error) {
        return res.status(400).json({ error: 'Parent not found' });
      }
    }

    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : ObjectId(parentId),
    };

    if (type === 'folder') {
      try {
        await dbClient.db.collection('files').insertOne(fileData);
        return res.status(201).json(fileData);
      } catch (error) {
        return res.status(500).json({ error: 'Error creating folder' });
      }
    }

    // Process file or image
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const fileUUID = uuidv4();
    const filePath = path.join(folderPath, fileUUID);
    const fileContent = Buffer.from(data, 'base64');

    try {
      fs.writeFileSync(filePath, fileContent);
      fileData.localPath = filePath;

      await dbClient.db.collection('files').insertOne(fileData);
      return res.status(201).json(fileData);
    } catch (error) {
      return res.status(500).json({ error: 'Error saving file' });
    }
  }

  /**
   * GET /files/:id
   * Retrieves the file document based on the ID.
   */
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    // Retrieve the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the file document
    let fileDocument;
    try {
      fileDocument = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(fileId),
        userId: ObjectId(userId),
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
   * Retrieves all user files for a specific parentId with pagination.
   */
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const { parentId = 0, page = 0 } = req.query;

    // Retrieve the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Set pagination variables
    const pageSize = 20;
    const skip = page * pageSize;

    // Query to get files
    try {
      const files = await dbClient.db.collection('files')
        .aggregate([
          { $match: { userId: ObjectId(userId), parentId: parentId === '0' ? 0 : ObjectId(parentId) } },
          { $skip: skip },
          { $limit: pageSize },
        ])
        .toArray();

      return res.status(200).json(files);
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching files' });
    }
  }

  /**
   * PUT /files/:id/publish
   * Set the isPublic field to true for a file document.
   */
  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    // Retrieve the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find and update the file document
    try {
      const fileDocument = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: new ObjectId(fileId), userId: ObjectId(userId) },
        { $set: { isPublic: true } },
        { returnDocument: 'after' }
      );

      if (!fileDocument.value) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(fileDocument.value);
    } catch (error) {
      return res.status(500).json({ error: 'Error updating file' });
    }
  }

  /**
   * PUT /files/:id/unpublish
   * Set the isPublic field to false for a file document.
   */
  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    // Retrieve the user from Redis using the token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find and update the file document
    try {
      const fileDocument = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: new ObjectId(fileId), userId: ObjectId(userId) },
        { $set: { isPublic: false } },
        { returnDocument: 'after' }
      );

      if (!fileDocument.value) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(fileDocument.value);
    } catch (error) {
      return res.status(500).json({ error: 'Error updating file' });
    }
  }
}

export default FilesController;
