import { Router } from 'express';
import { Address } from 'viem';
import { getStakeTransaction } from '../services/stake/stake';
import { getUndelegateFromPoolTransaction } from '../services/stake/unstake';
import { getWithdrawTransaction } from '../services/stake/withdraw';

const router = Router();

// Stake SONIC
router.post('/deposit', async (req, res) => {
  try {
    const { amount, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const txData = await getStakeTransaction(
      amount,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    if (error.message.includes('Insufficient')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Undelegate shares from pool
router.post('/undelegate', async (req, res) => {
  try {
    const { amountShares, userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    if (!amountShares) {
      return res.status(400).json({ error: 'amountShares is required' });
    }

    const txData = await getUndelegateFromPoolTransaction(
      amountShares,
      userAddress as Address
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Withdraw staked SONIC
router.post('/withdraw', async (req, res) => {
  try {
    const { withdrawId } = req.body;

    if (!withdrawId) {
      return res.status(400).json({ error: 'withdrawId is required' });
    }

    const txData = await getWithdrawTransaction(
      withdrawId,
    );

    res.json(txData);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
