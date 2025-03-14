import {
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidity,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PERMIT2,
  Address,
  PriceImpact,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions } from "viem";
import { sonic } from "viem/chains";
import { AddLiquidityResponse } from "../../../types";
import { checkMultipleTokenBalances } from "../../../utils/balanceCheck";

export async function getUnbalancedAddLiquidityTransaction(
  amountsIn: InputAmount[],
  poolId: string,
  slippageStr: string,
  userAddress: Address,
): Promise<AddLiquidityResponse> {
  const chainId = ChainId.SONIC;
  const RPC_URL = process.env.RPC_URL!;

  const client = createWalletClient({
    chain: sonic,
    transport: http(RPC_URL),
  }).extend(walletActions).extend(publicActions);

  // Check balances before proceeding
  await checkMultipleTokenBalances(client, userAddress, amountsIn);

  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    chainId
  );

  const poolState = await balancerApi.pools.fetchPoolState(poolId);
  if (!poolState) {
    throw new Error("Failed to fetch pool state");
  }

  const slippage = Slippage.fromPercentage(`${parseFloat(slippageStr)}`);

  const addLiquidityInput: AddLiquidityInput = {
    amountsIn,
    chainId,
    rpcUrl: RPC_URL,
    kind: AddLiquidityKind.Unbalanced,
  };

  // Check price impact
  try {
    const priceImpact = await PriceImpact.addLiquidityUnbalanced(
      addLiquidityInput,
      poolState
    );
    if (priceImpact.percentage > 5) {
      throw new Error(`High price impact detected: ${priceImpact.percentage.toFixed(2)}%`);
    }
  } catch (error) {
    console.warn("Price impact check failed:", error);
  }

  const addLiquidity = new AddLiquidity();
  const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

  const priceImpact = await PriceImpact.addLiquidityUnbalanced(
    addLiquidityInput,
    poolState
  );

  if (priceImpact.percentage > 5) {
    throw new Error(
      `High price impact: ${priceImpact.percentage.toFixed(2)}%`
    );
  }

  // Return approval data for tokens that need to be approved
  const approvals = amountsIn.map(token => ({
    token: token.address,
    spender: PERMIT2[chainId],
    amount: token.rawAmount,
  }));

  return {
    approvals,
    expectedBptOut: queryOutput.bptOut.amount.toString(),
    tokens: queryOutput.amountsIn.map((amount) => ({
      address: amount.token.address,
      amount: amount.amount.toString(),
    })),
    priceImpact: priceImpact.percentage.toFixed(2),
    poolAddress: poolState.address,
    permitData: {
      queryOutput,
      slippage,
    }
  };
}
