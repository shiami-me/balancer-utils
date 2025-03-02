import {
  SwapKind,
  Swap,
  Slippage,
  BalancerApi,
  Token,
  ChainId,
  TokenAmount,
  Permit2Helper,
  PERMIT2,
} from "@balancer/sdk";
import { createWalletClient, http, Address, walletActions, publicActions } from "viem";
import { sonic } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { checkSingleTokenBalance } from '../../utils/balanceCheck';
import { getTokenBySymbol, getTokenByAddress } from '../queries';

/**
 * Generate transaction data for token swap
 * @param tokenIn Input token symbol or address
 * @param tokenOut Output token symbol or address
 * @param poolId ID of the pool to use for swapping
 * @param slippage Maximum allowed slippage percentage
 * @param userAddress User's wallet address
 * @returns Transaction data for the swap
 */
export const getSwapTransaction = async (
  tokenIn: string,
  tokenOut: string,
  slippage: number,
  userAddress: Address
) => {
  try {
    // Resolve tokens (handle both symbols and addresses)
    const resolvedTokenIn = tokenIn.startsWith('0x') 
      ? await getTokenByAddress(tokenIn) 
      : await getTokenBySymbol(tokenIn);
      
    const resolvedTokenOut = tokenOut.startsWith('0x') 
      ? await getTokenByAddress(tokenOut) 
      : await getTokenBySymbol(tokenOut);
    
    if (!resolvedTokenIn) {
      throw new Error(`Token not found: ${tokenIn}`);
    }
    
    if (!resolvedTokenOut) {
      throw new Error(`Token not found: ${tokenOut}`);
    }

    const chainId = ChainId.SONIC;
    const RPC_URL = process.env.RPC_URL!;
    const PRIVATE_KEY = process.env.PRIVATE_KEY!;

    const client = createWalletClient({
      chain: sonic,
      transport: http(RPC_URL),
    }).extend(walletActions).extend(publicActions);

    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

    // Create token instances
    const tokenInInstance = new Token(chainId, resolvedTokenIn.address, resolvedTokenIn.decimals);
    const swapAmount = TokenAmount.fromHumanAmount(tokenInInstance, resolvedTokenIn.amount);

    // Check token balance first
    await checkSingleTokenBalance(client, userAddress, {
      address: resolvedTokenIn.address,
      rawAmount: swapAmount.amount,
      decimals: resolvedTokenIn.decimals
    });

    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);

    const paths = await balancerApi.sorSwapPaths.fetchSorSwapPaths({
      chainId,
      tokenIn: resolvedTokenIn.address,
      tokenOut: resolvedTokenOut.address,
      swapKind: SwapKind.GivenIn,
      swapAmount,
    });
    const swap = new Swap({ chainId, paths, swapKind: SwapKind.GivenIn });
    const queryOutput = await swap.query(RPC_URL);

    const slippageInstance = Slippage.fromPercentage(`${slippage}`);

    const permit2 = await Permit2Helper.signSwapApproval({
      queryOutput,
      slippage: slippageInstance,
      client,
      owner: account.address,
    });

    const call = swap.buildCallWithPermit2({ queryOutput, slippage: slippageInstance }, permit2);

    return {
      transaction: {
        to: call.to,
        data: call.callData,
        value: call.value ?? 0,
      },
      approvals: [{
        token: resolvedTokenIn.address,
        spender: PERMIT2[chainId],
        amount: swapAmount.amount
      }],
      paths
    };
  } catch (error) {
    console.error('Error in getSwapTransaction:', error);
    throw error;
  }
};
