import { encodeFunctionData, Address } from "viem";

const STAKING_CONTRACT_ADDRESS = '0xD5F7FC8ba92756a34693bAA386Edcc8Dd5B3F141';

/**
 * Generate transaction data for withdrawing from the staking pool
 * @param withdrawId ID of the withdrawal request
 * @param emergency Whether this is an emergency withdrawal
 * @param userAddress User's wallet address
 * @returns Transaction data for the withdrawal
 */
export async function getWithdrawTransaction(
  withdrawId: string
) {
  try {
    // Encode the withdraw function call
    const data = encodeFunctionData({
      abi: [{
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'withdrawId', type: 'uint256' },
          { name: 'emergency', type: 'bool' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      }],
      functionName: 'withdraw',
      args: [BigInt(withdrawId), false]
    });

    return {
      transaction: {
        to: STAKING_CONTRACT_ADDRESS,
        data,
        value: '0',
      }
    };
  } catch (error) {
    console.error('Error in getWithdrawTransaction:', error);
    throw error;
  }
}
