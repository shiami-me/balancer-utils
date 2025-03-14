import { Router } from 'express';
import { Address } from '@balancer/sdk';
import { getSwapTransaction } from '../services/swap/swap';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { tokenIn, tokenOut, slippage, userAddress, amount } = req.body;

    if (!tokenIn || !tokenOut) {
      return res.status(400).json({ error: 'tokenIn and tokenOut are required' });
    }

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    // Default slippage to 0.5% if not provided
    const slippageValue = typeof slippage === 'number' ? slippage : 0.5;

    const txData = await getSwapTransaction(
      tokenIn,
      tokenOut,
      slippageValue,
      userAddress as Address,
      amount
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    
    res.status(400).json({ error: error.message });
  }
});

export default router;
