import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
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

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Hotel Booking System API',
    version: '1.0.0',
    description: 'API documentation for the Hotel Booking System',
  },
  servers: [
    {
      url: 'https://talentrahotel-production.up.railway.app',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      Hotel: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB ObjectId'
          },
          name: {
            type: 'string',
            description: 'Hotel name'
          },
          city: {
            type: 'string',
            description: 'Hotel city'
          },
          price: {
            type: 'number',
            description: 'Hotel price per night'
          },
          rating: {
            type: 'number',
            description: 'Hotel rating'
          },
          description: {
            type: 'string',
            description: 'Hotel description'
          },
          available: {
            type: 'boolean',
            description: 'Hotel availability'
          },
          amenities: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Hotel amenities'
          }
        }
      },
      Booking: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB ObjectId'
          },
          hotel: {
            type: 'string',
            description: 'Hotel ObjectId reference'
          },
          user: {
            type: 'string',
            description: 'User ObjectId reference (optional)'
          },
          checkIn: {
            type: 'string',
            format: 'date-time',
            description: 'Check-in date'
          },
          checkOut: {
            type: 'string',
            format: 'date-time',
            description: 'Check-out date'
          },
          guests: {
            type: 'integer',
            description: 'Number of guests'
          },
          totalAmount: {
            type: 'number',
            description: 'Total booking amount'
          },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'cancelled'],
            description: 'Booking status'
          },
          paymentStatus: {
            type: 'string',
            enum: ['pending', 'succeeded', 'failed', 'canceled'],
            description: 'Payment status'
          },
          stripePaymentIntentId: {
            type: 'string',
            description: 'Stripe payment intent ID'
          },
          paidAt: {
            type: 'string',
            format: 'date-time',
            description: 'Payment completion date'
          }
        }
      }
    }
  }
};

// Swagger options
const swaggerOptions = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API routes
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Database connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger middleware
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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