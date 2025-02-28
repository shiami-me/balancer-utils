import { createPublicClient, http, Address, encodeFunctionData } from "viem";
import { sonic } from "viem/chains";
import { checkNativeTokenBalance, getSingleTokenBalance } from '../../utils/balanceCheck';
import { InputAmount } from "@balancer/sdk";

const STAKING_CONTRACT_ADDRESS = '0xD5F7FC8ba92756a34693bAA386Edcc8Dd5B3F141';

/**
 * Generate transaction data for staking SONIC into the staking contract
 * @param amount Amount of native tokens to stake (in wei)
 * @param userAddress User's wallet address
 * @returns Transaction data for the stake
 */
export async function getStakeTransaction(
  amount: string,
  userAddress: Address
) {
  try {
    const client = createPublicClient({
      chain: sonic,
      transport: http(process.env.RPC_URL),
    });

    // Check native token balance first
    await checkNativeTokenBalance(client, userAddress, amount);

    // Encode the deposit function call (deposit doesn't take parameters, it uses msg.value)
    const data = encodeFunctionData({
      abi: [{
        name: 'deposit',
        type: 'function',
        stateMutability: 'payable',
        inputs: [],
        outputs: [{ type: 'uint256' }]
      }],
      functionName: 'deposit',
      args: []
    });

    return {
      transaction: {
        to: STAKING_CONTRACT_ADDRESS,
        data,
        value: amount,
      }
    };
  } catch (error) {
    console.error('Error in getStakeTransaction:', error);
    throw error;
  }
}

export async function getUserBalance(userAddress: Address) {
  try {
    const client = createPublicClient({
      chain: sonic,
      transport: http(process.env.RPC_URL),
    });

    const token: InputAmount =  {
      address: STAKING_CONTRACT_ADDRESS as `0x${string}`,
      rawAmount: BigInt(0),
      decimals: 18
    }

    const balance = await getSingleTokenBalance(client, userAddress, token);
    return balance.toString();
  } catch (error) {
    console.error('Error in getUserBalance:', error);
    throw error;
  }
}