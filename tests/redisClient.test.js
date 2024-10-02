import { expect } from 'chai';
import redisClient from '../redis'; // Adjust the path according to your structure
import sinon from 'sinon';

describe('RedisClient', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should log errors on Redis client', (done) => {
    const errorStub = sinon.stub(console, 'error');
    redisClient.client.emit('error', new Error('Redis connection error'));
    
    setTimeout(() => {
      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.calledWith('Redis client error:', sinon.match.instanceOf(Error))).to.be.true;
      errorStub.restore();
      done();
    }, 100);
  });

  it('should set a key in Redis', async () => {
    const setAsyncStub = sinon.stub(redisClient.setAsync, 'call').resolves();
    await redisClient.set('testKey', 'testValue', 60);
    
    expect(setAsyncStub.calledOnce).to.be.true;
  });

  it('should get a key from Redis', async () => {
    const getAsyncStub = sinon.stub(redisClient.getAsync, 'call').resolves('testValue');
    const value = await redisClient.get('testKey');
    
    expect(value).to.equal('testValue');
    expect(getAsyncStub.calledOnce).to.be.true;
  });

  it('should delete a key from Redis', async () => {
    const delAsyncStub = sinon.stub(redisClient.delAsync, 'call').resolves();
    await redisClient.del('testKey');
    
    expect(delAsyncStub.calledOnce).to.be.true;
  });

  it('should check if Redis client is alive', () => {
    expect(redisClient.isAlive()).to.be.true;
  });
});
