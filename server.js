import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db/connection.js';
import searchRoutes from './routes/searchRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Log every request to debug Railway proxy issues
app.use((req, res, next) => {
  console.log(`[REQ] Incoming request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// Default route for health checks
app.get('/', (req, res) => {
  res.status(200).send('Hotel Booking API is running perfectly! (v2)');
});

// The proxy is explicitly hitting port 3000 on the container, so we must force it here
const actualPort = 3000;

// Start server (Bind to 0.0.0.0 for Railway IPv4 mesh)
app.listen(actualPort, '0.0.0.0', () => {
  console.log(`✅ Server securely bound and running on port ${actualPort}`);
});