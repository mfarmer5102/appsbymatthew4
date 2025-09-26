require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import database connection
const connectDB = require('./config/database');

// Import routes
const applicationsRoutes = require('./routes/applications');
const skillTypesRoutes = require('./routes/skillTypes');
const skillsRoutes = require('./routes/skills');
const supportStatusRoutes = require('./routes/supportStatus');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:*'
  ],
  credentials: true
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/applications', applicationsRoutes);
app.use('/api/skill-types', skillTypesRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/support-status', supportStatusRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Portfolio API',
    version: '1.0.0',
    endpoints: {
      applications: {
        base: '/api/applications',
        methods: ['GET', 'POST'],
        'by-id': '/api/applications/:id',
        'by-id-methods': ['GET', 'PUT', 'PATCH', 'DELETE']
      },
      skillTypes: {
        base: '/api/skill-types',
        methods: ['GET', 'POST'],
        'by-id': '/api/skill-types/:id',
        'by-id-methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
        'by-code': '/api/skill-types/code/:code',
        'by-code-methods': ['GET']
      },
      skills: {
        base: '/api/skills',
        methods: ['GET', 'POST'],
        'by-id': '/api/skills/:id',
        'by-id-methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
        'by-code': '/api/skills/code/:code',
        'by-code-methods': ['GET'],
        'by-type': '/api/skills/type/:skillTypeCode',
        'by-type-methods': ['GET']
      },
      supportStatus: {
        base: '/api/support-status',
        methods: ['GET', 'POST'],
        'by-id': '/api/support-status/:id',
        'by-id-methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
        'by-code': '/api/support-status/code/:code',
        'by-code-methods': ['GET']
      }
    },
    queryParameters: {
      pagination: {
        limit: 'Number of items per page (default: 50)',
        offset: 'Number of items to skip (default: 0)'
      },
      applications: {
        featured: 'Filter by featured status (true/false)',
        support_status: 'Filter by support status code'
      },
      skills: {
        proficient: 'Filter by proficiency (true/false)',
        skill_type: 'Filter by skill type code',
        visible: 'Filter by visibility in app details (true/false)'
      }
    }
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
