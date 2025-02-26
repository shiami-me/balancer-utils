import { Router } from 'express';
import { getTokenBySymbol, getTokenByAddress, getUserPoolEvents, getPoolById } from '../services/queries';

const router = Router();

// Get token by symbol or name
router.get('/token/symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const token = await getTokenBySymbol(symbol);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json(token);
  } catch (error: any) {
    console.error('Error fetching token by symbol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get token by address
router.get('/token/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }
    
    const token = await getTokenByAddress(address);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json(token);
  } catch (error: any) {
    console.error('Error fetching token by address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pool events for a user
router.get('/pool/events/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const first = parseInt(req.query.first as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'User address parameter is required' });
    }
    
    const events = await getUserPoolEvents(first, skip, userAddress);
    res.json(events);
  } catch (error: any) {
    console.error('Error fetching pool events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pool by ID
router.get('/pool/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    if (!poolId) {
      return res.status(400).json({ error: 'Pool ID parameter is required' });
    }
    
    const pool = await getPoolById(poolId);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    res.json(pool);
  } catch (error: any) {
    console.error('Error fetching pool:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
