import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PriceImpact,
} from "@balancer/sdk";
import { createPublicClient, http, Address } from "viem";
import { sonic } from "viem/chains";
import { checkSingleTokenBalance } from "../../../utils/balanceCheck";

export async function getSingleTokenV2AddLiquidityTransaction(
  bptOut: InputAmount,
  tokenIn: Address,
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

    const addLiquidityInput: AddLiquidityInput = {
      bptOut,
      tokenIn,
      chainId,
      rpcUrl: process.env.RPC_URL!,
      kind: AddLiquidityKind.SingleToken,
    };

    const addLiquidity = new AddLiquidity();
    const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

    // Check balance after we know how much we need
    await checkSingleTokenBalance(client, userAddress, {
      address: tokenIn,
      rawAmount: queryOutput.amountsIn[0].amount,
      decimals: queryOutput.amountsIn[0].token.decimals,
    });

    // Check price impact
    const priceImpact = await PriceImpact.addLiquiditySingleToken(
      addLiquidityInput,
      poolState
    );

    if (priceImpact.percentage > 5) {
      throw new Error(
        `High price impact: ${priceImpact.percentage.toFixed(2)}%`
      );
    }

    const call = addLiquidity.buildCall({
      ...queryOutput,
      slippage: Slippage.fromPercentage(slippage),
      chainId,
      wethIsEth: true,
      sender: userAddress,
      recipient: userAddress,
      fromInternalBalance: false,
    });

    return {
      call,
      priceImpact: priceImpact.percentage,
      expectedBptOut: queryOutput.bptOut.amount.toString(),
      poolAddress: poolState.address,
      tokens: queryOutput.amountsIn.map((amount) => ({
        address: amount.token.address,
        amount: amount.amount.toString(),
      })),
      approvals: [
        {
          token: tokenIn,
          spender: poolState.address,
          amount: queryOutput.amountsIn[0].amount,
        },
      ],
    };
  } catch (error) {
    throw error;
  }
}
