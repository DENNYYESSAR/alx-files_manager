import { expect } from 'chai';
import dbClient from '../db'; // Adjust the path according to your structure
import sinon from 'sinon';

describe('DBClient', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should connect to MongoDB successfully', async () => {
    const connectStub = sinon.stub(dbClient.client, 'connect').resolves();
    await dbClient.client.connect();
    expect(connectStub.calledOnce).to.be.true;
  });

  it('should return the number of users', async () => {
    const countDocumentsStub = sinon.stub(dbClient.db.collection('users'), 'countDocuments').resolves(10);
    
    const count = await dbClient.nbUsers();
    expect(count).to.equal(10);
    expect(countDocumentsStub.calledOnce).to.be.true;
  });

  it('should return the number of files', async () => {
    const countDocumentsStub = sinon.stub(dbClient.db.collection('files'), 'countDocuments').resolves(5);
    
    const count = await dbClient.nbFiles();
    expect(count).to.equal(5);
    expect(countDocumentsStub.calledOnce).to.be.true;
  });

  it('should return 0 if db is not connected', async () => {
    const originalDb = dbClient.db;
    dbClient.db = null; // Simulate disconnection
    
    const count = await dbClient.nbUsers();
    expect(count).to.equal(0);
    
    dbClient.db = originalDb; // Restore original db
  });
});
