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

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// Default route for health checks
app.get('/', (req, res) => {
  res.send('Hotel Booking API is running perfectly!');
});

// Explicitly parse PORT as a number to prevent binding issues
const actualPort = parseInt(process.env.PORT, 10) || 3000;

// Start server (Bind to '::' to support Railway's modern IPv6 mesh network)
app.listen(actualPort, '::', () => {
  console.log(`✅ Server running securely on port ${actualPort}`);
});