import {
  RemoveLiquidityInput,
  RemoveLiquidityKind,
  RemoveLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PriceImpact,
} from "@balancer/sdk";
import { createPublicClient, http, Address } from "viem";
import { sonic } from "viem/chains";
import { checkSingleTokenBalance } from '../../../utils/balanceCheck';

const client = createPublicClient({
  chain: sonic,
  transport: http(process.env.RPC_URL),
});

export async function getSTEOV2RemoveLiquidityTransaction(
  amountOut: InputAmount,
  poolId: string,
  slippage: `${number}`,
  userAddress: Address
) {
  try {
    const chainId = ChainId.SONIC;
    const balancerApi = new BalancerApi("https://backend-v3.beets-ftm-node.com", chainId);
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    // Verify token is in pool
    const tokenInPool = poolState.tokens.some(
      token => token.address.toLowerCase() === amountOut.address.toLowerCase()
    );
    
    if (!tokenInPool) {
      throw new Error("Token not found in pool");
    }

    const removeLiquidityInput: RemoveLiquidityInput = {
      amountOut,
      chainId,
      rpcUrl: process.env.RPC_URL!,
      kind: RemoveLiquidityKind.SingleTokenExactOut,
    };

    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(removeLiquidityInput, poolState);

    // Check BPT balance after we know how much is needed
    await checkSingleTokenBalance(client, userAddress, {
      address: poolState.address,
      rawAmount: queryOutput.bptIn.amount,
      decimals: 18, // BPT tokens always have 18 decimals
    });

    const call = removeLiquidity.buildCall({
      ...queryOutput,
      slippage: Slippage.fromPercentage(slippage),
      chainId,
      sender: userAddress,
      recipient: userAddress,
      toInternalBalance: false
    });

    return {
      call,
      bptIn: queryOutput.bptIn.amount.toString(),
      maxBptIn: call.maxBptIn.amount.toString(),
      tokenOut: amountOut.address,
      poolAddress: poolState.address,
      approvals: [{
        token: poolState.address, // BPT token address is the pool address
        spender: poolState.address,
        amount: queryOutput.bptIn.amount
      }]
    };
  } catch (error) {
    throw error;
  }
}
