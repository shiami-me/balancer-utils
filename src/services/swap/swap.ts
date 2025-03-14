import {
  SwapKind,
  Swap,
  Slippage,
  BalancerApi,
  Token,
  ChainId,
  TokenAmount,
  PERMIT2,
  SwapBuildOutputExactIn,
  ExactInQueryOutput,
} from "@balancer/sdk";
import { createWalletClient, http, Address, walletActions, publicActions } from "viem";
import { sonic } from "viem/chains";
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
  userAddress: Address,
  amount: number
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

    const client = createWalletClient({
      chain: sonic,
      transport: http(RPC_URL),
    }).extend(walletActions).extend(publicActions);

    // Create token instances
    const tokenInInstance = new Token(chainId, resolvedTokenIn.address, resolvedTokenIn.decimals);
    const swapAmount = TokenAmount.fromHumanAmount(tokenInInstance, amount.toString() as `${number}`);

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
    const queryOutput = await swap.query(RPC_URL) as ExactInQueryOutput;

    const slippageInstance = Slippage.fromPercentage(`${slippage}`);
    if (swap.protocolVersion === 2) {
      const callData = swap.buildCall({
        slippage: slippageInstance,
        queryOutput,
        wethIsEth: true,
        sender: userAddress,
        recipient: userAddress,
      }) as SwapBuildOutputExactIn;
      return {
        transaction: {
          to: callData.to,
          data: callData.callData,
          value: callData.value,
        },
        paths,
        approvals: [{
          token: queryOutput.amountIn.token.address,
          spender: callData.to,
          amount: queryOutput.amountIn.amount
        }]
      }
    } else {
      return {
        approvals: [{
          token: resolvedTokenIn.address,
          spender: PERMIT2[chainId],
          amount: swapAmount.amount
        }],
        paths,
        permitData: {
          queryOutput,
          slippage: slippageInstance,
        }
      };
    }
  } catch (error) {
    console.error('Error in getSwapTransaction:', error);
    throw error;
  }
};
