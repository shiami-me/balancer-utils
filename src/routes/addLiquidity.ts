import { Router } from 'express';
import { getBoostedUnbalancedAddLiquidityTransaction } from '../services/addLiquidity/v3/v3BoostedUnbalanced';
import { getBoostedProportionalAddLiquidityTransaction } from '../services/addLiquidity/v3/v3BoostedProportional';
import { getUnbalancedAddLiquidityTransaction } from '../services/addLiquidity/v3/v3Unbalanced';
import { getProportionalAddLiquidityTransaction } from '../services/addLiquidity/v3/v3Proportional';
import { getUnbalancedV2AddLiquidityTransaction } from '../services/addLiquidity/v2/v2Unbalanced';
import { getProportionalV2AddLiquidityTransaction } from '../services/addLiquidity/v2/v2Proportional';
import { getSingleTokenV2AddLiquidityTransaction } from '../services/addLiquidity/v2/v2SingleToken';
import { getSingleTokenAddLiquidityTransaction } from '../services/addLiquidity/v3/v3SingleToken';
import { Address } from '@balancer/sdk';

const router = Router();

// V3 Routes
router.post('/v3/boosted/unbalanced', async (req, res) => {
  try {
    const { amountsIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getBoostedUnbalancedAddLiquidityTransaction(
      amountsIn,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    // Check if error is balance related
    if (error.message.includes('Insufficient balance')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v3/boosted/proportional', async (req, res) => {
  try {
    const { referenceAmount, tokensIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getBoostedProportionalAddLiquidityTransaction(
      referenceAmount,
      tokensIn,
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

router.post('/v3/unbalanced', async (req, res) => {
  try {
    const { amountsIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getUnbalancedAddLiquidityTransaction(
      amountsIn,
      poolId,
      slippage,
      userAddress as Address
    );
    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance') || error.message.includes('High price impact')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v3/proportional', async (req, res) => {
  try {
    const { referenceAmount, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getProportionalAddLiquidityTransaction(
      referenceAmount,
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

router.post('/v3/single-token', async (req, res) => {
  try {
    const { bptOut, tokenIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getSingleTokenAddLiquidityTransaction(
      bptOut,
      tokenIn,
      poolId,
      slippage,
      userAddress as Address
    );
    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance') || error.message.includes('High price impact')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// V2 Routes
router.post('/v2/unbalanced', async (req, res) => {
  try {
    const { amountsIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getUnbalancedV2AddLiquidityTransaction(
      amountsIn,
      poolId,
      slippage,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance') || error.message.includes('High price impact')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/v2/proportional', async (req, res) => {
  try {
    const { referenceAmount, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getProportionalV2AddLiquidityTransaction(
      referenceAmount,
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

router.post('/v2/single-token', async (req, res) => {
  try {
    const { bptOut, tokenIn, poolId, slippage, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    const txData = await getSingleTokenV2AddLiquidityTransaction(
      bptOut,
      tokenIn,
      poolId,
      slippage,
      userAddress as Address
    );
    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient balance') || error.message.includes('High price impact')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
