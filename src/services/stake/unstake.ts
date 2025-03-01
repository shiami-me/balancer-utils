import { createPublicClient, http, Address, encodeFunctionData } from "viem";
import { sonic } from "viem/chains";
import { checkSingleTokenBalance } from "../../utils/balanceCheck";
import { InputAmount } from "@balancer/sdk";

const STAKING_CONTRACT_ADDRESS = '0xE5DA20F15420aD15DE0fa650600aFc998bbE3955';

/**
 * Generate transaction data for undelegating shares from the staking pool
 * @param amountShares Amount of shares to undelegate (in wei)
 * @param userAddress User's wallet address
 * @returns Transaction data for the undelegation
 */
export async function getUndelegateFromPoolTransaction(
  amountShares: string,
  userAddress: Address
) {
  try {
    // Create client to interact with the blockchain
    const client = createPublicClient({
      chain: sonic,
      transport: http(process.env.RPC_URL),
    });
    const token: InputAmount =  {
        address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
        rawAmount: BigInt(amountShares),
        decimals: 18
    }
    // Check if user has enough staking balance
    await checkSingleTokenBalance(client, userAddress, token);

    // Encode the undelegateFromPool function call
    const data = encodeFunctionData({
      abi: [{
        name: 'undelegateFromPool',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amountShares', type: 'uint256' }],
        outputs: [{ name: 'withdrawId', type: 'uint256' }]
      }],
      functionName: 'undelegateFromPool',
      args: [BigInt(amountShares)]
    });

    return {
      transaction: {
        to: STAKING_CONTRACT_ADDRESS,
        data,
        value: '0',
      }
    };
  } catch (error) {
    console.error('Error in getUndelegateFromPoolTransaction:', error);
    throw error;
  }
}
