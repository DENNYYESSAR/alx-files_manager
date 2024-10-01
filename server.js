import express from 'express';
import Redis from 'ioredis';
import routes from './routes/index';
import dbClient from './utils/db'; // Import your DBClient

const app = express();
const port = process.env.PORT || 5000;

// Initialize Redis client
const redisClient = new Redis();

// Middleware to check Redis health
app.use((req, res, next) => {
  redisClient.ping((err, result) => {
    if (err || result !== 'PONG') {
      req.redisAlive = false;
    } else {
      req.redisAlive = true;
    }
    next();
  });
});

// Load routes
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
