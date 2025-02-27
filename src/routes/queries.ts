import { Router } from 'express';
import { getTokenBySymbol, getTokenByAddress, getUserPoolEvents, getPoolById, getPools } from '../services/queries';

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
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

router.get('/pools', async (req, res) => {
  try {
    const first = parseInt(req.query.first as string) || undefined;
    const orderBy = req.query.orderBy as "apr" | "fees24h" | "totalLiquidity" | "volume24h" | "totalShares" | "userBalanceUsd" | 'apr';
    const orderDirection = req.query.orderDirection as "desc" | "asc" | 'desc';
    const skip = parseInt(req.query.skip as string) || 0;
    const textSearch = req.query.textSearch as string || '';
    const userAddress = req.query.userAddress as string || undefined;

    const pools = await getPools(first, orderBy, orderDirection, skip, textSearch, userAddress);
    res.json(pools);
  } catch (error: any) {
    console.error('Error fetching pools:', error);
    res.status(400).json({ error: error.message });
  }
})

export default router;
