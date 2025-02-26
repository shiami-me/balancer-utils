import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swapRoutes from './routes/swap';
import queryRoutes from './routes/queries';
import addLiquidityRoutes from './routes/addLiquidity';
import removeLiquidityRoutes from './routes/removeLiquidity';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// API Routes
app.use('/api/swap', swapRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/add-liquidity', addLiquidityRoutes);
app.use('/api/remove-liquidity', removeLiquidityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
