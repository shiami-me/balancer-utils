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
import { checkMultipleTokenBalances } from "../../../utils/balanceCheck";

export async function getUnbalancedV2RemoveLiquidityTransaction(
  amountsOut: InputAmount[],
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

    // Verify tokens are in pool
    const userTokenAddresses = amountsOut.map((input) =>
      input.address.toLowerCase()
    );
    const poolTokenAddresses = poolState.tokens.map((token) =>
      token.address.toLowerCase()
    );

    const allTokensInPool = userTokenAddresses.every((address) =>
      poolTokenAddresses.includes(address)
    );

    if (!allTokensInPool) {
      throw new Error("Not all tokens are in the pool");
    }

    const removeLiquidityInput: RemoveLiquidityInput = {
      amountsOut,
      chainId,
      rpcUrl: process.env.RPC_URL!,
      kind: RemoveLiquidityKind.Unbalanced,
    };

    const removeLiquidity = new RemoveLiquidity();
    const queryOutput = await removeLiquidity.query(
      removeLiquidityInput,
      poolState
    );

    // Check BPT balance after we know how much is needed
    await checkMultipleTokenBalances(client, userAddress, [
      {
        address: poolState.address,
        rawAmount: queryOutput.bptIn.amount,
        decimals: 18, // BPT tokens always have 18 decimals
      },
    ]);

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

    const call = removeLiquidity.buildCall({
      ...queryOutput,
      slippage: Slippage.fromPercentage(slippage),
      chainId,
      sender: userAddress,
      recipient: userAddress,
      toInternalBalance: false,
    });

    return {
      call,
      priceImpact: priceImpact.percentage,
      bptIn: queryOutput.bptIn.amount.toString(),
      maxBptIn: call.maxBptIn.amount.toString(),
      tokensOut: queryOutput.amountsOut.map((amount) => ({
        address: amount.token.address,
        amount: amount.amount.toString(),
      })),
      approvals: [
        {
          token: poolState.address, // BPT token address is the pool address
          spender: poolState.address,
          amount: queryOutput.bptIn.amount,
        },
      ],
    };
  } catch (error) {
    throw error;
  }
}
