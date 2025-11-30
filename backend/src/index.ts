import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import targetRoutes from './routes/targetRoutes';
import testRoutes from './routes/testRoutes';
import reportRoutes from './routes/reportRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ThunderStrike API - Intelligent Chaos Testing Platform',
    version: '1.0.0',
    endpoints: {
      targets: '/api/targets',
      tests: '/api/tests',
      reports: '/api/reports',
    },
  });
});

app.use('/api/targets', targetRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`\n🚀 ThunderStrike API server running on port ${PORT}`);
      console.log(`📍 API endpoint: http://localhost:${PORT}`);
      console.log(`📚 API docs: http://localhost:${PORT}/api`);
      console.log('\n⚡ Ready to execute chaos tests!\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();