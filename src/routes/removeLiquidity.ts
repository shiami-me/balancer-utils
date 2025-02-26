import { Router } from 'express';
import { Address } from '@balancer/sdk';
import { getSTEORemoveLiquidityTransaction } from '../services/removeLiquidity/v3/v3STEORemove';
import { getSTEIRemoveLiquidityTransaction } from '../services/removeLiquidity/v3/v3STEIRemove';
import { getProportionalRemoveLiquidityTransaction } from '../services/removeLiquidity/v3/v3ProportionalRemove';
import { getBoostedProportionalRemoveLiquidityTransaction } from '../services/removeLiquidity/v3/v3BoostedProportionalRemove';
import { getSTEOV2RemoveLiquidityTransaction } from '../services/removeLiquidity/v2/v2STEORemove';
import { getSTEIV2RemoveLiquidityTransaction } from '../services/removeLiquidity/v2/v2STEIRemove';
import { getProportionalV2RemoveLiquidityTransaction } from '../services/removeLiquidity/v2/v2ProportionalRemove';
import { getUnbalancedV2RemoveLiquidityTransaction } from '../services/removeLiquidity/v2/v2UnbalancedRemove';

const router = Router();

// V3 Routes
router.post('/v3/single-token-exact-out', async (req, res) => {
  try {
    const { amountOut, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getSTEORemoveLiquidityTransaction(
      amountOut,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v3/single-token-exact-in', async (req, res) => {
  try {
    const { bptIn, tokenOut, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getSTEIRemoveLiquidityTransaction(
      bptIn,
      tokenOut,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v3/proportional', async (req, res) => {
  try {
    const { bptIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getProportionalRemoveLiquidityTransaction(
      bptIn,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v3/boosted/proportional', async (req, res) => {
  try {
    const { bptIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getBoostedProportionalRemoveLiquidityTransaction(
      bptIn,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// V2 Routes
router.post('/v2/single-token-exact-out', async (req, res) => {
  try {
    const { amountOut, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getSTEOV2RemoveLiquidityTransaction(
      amountOut,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v2/single-token-exact-in', async (req, res) => {
  try {
    const { bptIn, tokenOut, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getSTEIV2RemoveLiquidityTransaction(
      bptIn,
      tokenOut,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v2/proportional', async (req, res) => {
  try {
    const { bptIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getProportionalV2RemoveLiquidityTransaction(
      bptIn,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v2/unbalanced', async (req, res) => {
  try {
    const { amountsOut, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getUnbalancedV2RemoveLiquidityTransaction(
      amountsOut,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
