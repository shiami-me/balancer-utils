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

export async function getSTEIV2RemoveLiquidityTransaction(
  bptIn: InputAmount,
  tokenOut: Address,
  poolId: string,
  slippage: `${number}`,
  userAddress: Address
) {
  try {
    const client = createPublicClient({
      chain: sonic,
      transport: http(process.env.RPC_URL),
    });

    // Check BPT balance first
    await checkSingleTokenBalance(client, userAddress, bptIn);

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
      (token) => token.address.toLowerCase() === tokenOut.toLowerCase()
    );

    if (!tokenInPool) {
      throw new Error("Token not found in pool");
    }

    const removeLiquidityInput: RemoveLiquidityInput = {
      bptIn,
      tokenOut,
      chainId,
      rpcUrl: process.env.RPC_URL!,
      kind: RemoveLiquidityKind.SingleTokenExactIn,
    };

    // Check price impact
    const priceImpact = await PriceImpact.removeLiquidity(
      removeLiquidityInput,
      poolState
    );

    if (priceImpact.percentage > 5) {
      throw new Error(
        `High price impact: ${priceImpact.percentage.toFixed(2)}%`
      );
    }

    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(
      removeLiquidityInput,
      poolState
    );

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
      priceImpact: priceImpact.percentage,
      expectedAmountOut: queryOutput.amountsOut
        .filter(
          (amount) =>
            amount.token.address.toLowerCase() === tokenOut.toLowerCase()
        )[0]
        .amount.toString(),
      tokenOut: tokenOut,
      poolAddress: poolState.address
    };
  } catch (error) {
    throw error;
  }
}
