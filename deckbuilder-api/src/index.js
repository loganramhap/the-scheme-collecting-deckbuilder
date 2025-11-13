import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { validateEnvironment } from './config/validateEnv.js';
import { getCorsConfig, validateCorsConfig } from './config/cors.js';
import { startCleanupJob } from './services/cleanupService.js';
import authRoutes from './routes/auth.js';
import provisionRoutes from './routes/provision.js';
import validationRoutes from './routes/validation.js';
import cardsRoutes from './routes/cards.js';

dotenv.config();

// Validate environment variables before starting server
try {
  validateEnvironment();
  validateCorsConfig();
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS with security settings
app.use(cors(getCorsConfig()));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/provision', provisionRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/cards', cardsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`DeckBuilder API running on port ${PORT}`);
  console.log(`Using DynamoDB tables:`);
  console.log(`  Users: ${process.env.DYNAMODB_USERS_TABLE}`);
  console.log(`  Sessions: ${process.env.DYNAMODB_SESSIONS_TABLE}`);
  
  // Start background cleanup job for expired sessions
  startCleanupJob();
});
