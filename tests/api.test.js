import request from 'supertest';
import app from '../app'; // your express app
import { expect } from 'chai';

describe('API Tests', () => {
  let token;

  before(async () => {
    const res = await request(app)
      .get('/connect')
      .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE='); // example credentials
    token = res.body.token;
  });

  it('GET /status should return status', async () => {
    const res = await request(app).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status');
  });

  it('GET /stats should return stats', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).to.equal(200);
  });

  it('POST /users should create a user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.status).to.equal(201);
  });

  it('GET /connect should authenticate user', async () => {
    const res = await request(app).get('/connect').set('X-Token', token);
    expect(res.status).to.equal(200);
  });

  it('GET /disconnect should disconnect user', async () => {
    const res = await request(app).get('/disconnect').set('X-Token', token);
    expect(res.status).to.equal(200);
  });

  it('GET /users/me should return user info', async () => {
    const res = await request(app).get('/users/me').set('X-Token', token);
    expect(res.status).to.equal(200);
  });

  it('POST /files should upload a file', async () => {
    const res = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'testfile.txt', type: 'file', data: 'SGVsbG8=' });
    expect(res.status).to.equal(201);
  });

  it('GET /files/:id should retrieve a specific file', async () => {
    const fileId = 'your_file_id'; // replace with a valid file ID
    const res = await request(app).get(`/files/${fileId}`).set('X-Token', token);
    expect(res.status).to.equal(200);
  });

  it('GET /files should return files with pagination', async () => {
    const res = await request(app).get('/files?page=0').set('X-Token', token);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('files');
  });

  it('PUT /files/:id/publish should publish a file', async () => {
    const fileId = 'your_file_id'; // replace with a valid file ID
    const res = await request(app).put(`/files/${fileId}/publish`).set('X-Token', token);
    expect(res.status).to.equal(200);
  });

  it('PUT /files/:id/unpublish should unpublish a file', async () => {
    const fileId = 'your_file_id'; // replace with a valid file ID
    const res = await request(app).put(`/files/${fileId}/unpublish`).set('X-Token', token);
    expect(res.status).to.equal(200);
  });

  it('GET /files/:id/data should return file content', async () => {
    const fileId = 'your_file_id'; // replace with a valid file ID
    const res = await request(app).get(`/files/${fileId}/data`).set('X-Token', token);
    expect(res.status).to.equal(200);
  });
});
