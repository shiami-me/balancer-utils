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
import { checkSingleTokenBalance } from "../../../utils/balanceCheck";

export async function getSTEOV2RemoveLiquidityTransaction(
  amountOut: InputAmount,
  poolId: string,
  slippage: `${number}`,
  userAddress: Address
) {
  try {
    const client = createPublicClient({
      chain: sonic,
      transport: http(process.env.RPC_URL),
    });

    const chainId = ChainId.SONIC;
    const balancerApi = new BalancerApi(
      "https://backend-v3.beets-ftm-node.com",
      chainId
    );
    const poolState = await balancerApi.pools.fetchPoolState(poolId);

    if (!poolState) {
      throw new Error("Failed to fetch pool state");
    }

    // Verify token is in pool
    const tokenInPool = poolState.tokens.some(
      (token) => token.address.toLowerCase() === amountOut.address.toLowerCase()
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
    const queryOutput = await removeLiquidity.query(
      removeLiquidityInput,
      poolState
    );

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
      toInternalBalance: false,
    });

    return {
      transaction: {
        to: call.to,
        data: call.callData,
        value: call.value ?? 0,
      },
      bptIn: queryOutput.bptIn.amount.toString(),
      maxBptIn: call.maxBptIn.amount.toString(),
      tokenOut: amountOut.address,
      poolAddress: poolState.address
    };
  } catch (error) {
    throw error;
  }
}
