import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-production-app.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 5000;
// Use 0.0.0.0 to ensure the service is reachable externally
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});