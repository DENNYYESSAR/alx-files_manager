import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.url = `mongodb://${host}:${port}`;
    this.database = database;
    this.client = new MongoClient(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        console.log('Connected to MongoDB');
        this.db = this.client.db(this.database);
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    if (!this.db) return 0;
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    if (!this.db) return 0;
    return this.db.collection('files').countDocuments();
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
