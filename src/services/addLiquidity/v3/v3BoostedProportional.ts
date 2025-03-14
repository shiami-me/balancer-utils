import {
  AddLiquidityBoostedProportionalInput,
  AddLiquidityKind,
  AddLiquidityBoostedV3,
  BalancerApi,
  ChainId,
  Slippage,
  InputAmount,
  PERMIT2,
} from "@balancer/sdk";
import { createWalletClient, http, publicActions, walletActions, Address } from "viem";
import { sonic } from "viem/chains";
import { AddLiquidityResponse } from "../../../types";
import { checkSingleTokenBalance } from "../../../utils/balanceCheck";

export async function getBoostedProportionalAddLiquidityTransaction(
  referenceAmount: InputAmount,
  tokensIn: Address[],
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

  // Use utility function for balance checking
  await checkSingleTokenBalance(client, userAddress, referenceAmount);

  const balancerApi = new BalancerApi(
    "https://backend-v3.beets-ftm-node.com",
    chainId
  );

  const poolState = await balancerApi.boostedPools.fetchPoolStateWithUnderlyings(poolId);
  if (!poolState) {
    throw new Error("Failed to fetch pool state");
  }

  const slippage = Slippage.fromPercentage(`${parseFloat(slippageStr)}`);
  
  const addLiquidityInput: AddLiquidityBoostedProportionalInput = {
    referenceAmount,
    tokensIn,
    chainId,
    rpcUrl: RPC_URL,
    kind: AddLiquidityKind.Proportional,
  };

  const addLiquidity = new AddLiquidityBoostedV3();
  const queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

  const approvals = queryOutput.amountsIn.map((amountIn) => ({
    token: amountIn.token.address,
    spender: PERMIT2[chainId],
    amount: amountIn.amount,
  }));

  return {
    poolAddress: poolState.address,
    approvals,
    expectedBptOut: queryOutput.bptOut.amount.toString(),
    tokens: queryOutput.amountsIn.map((amount) => ({
      address: amount.token.address,
      amount: amount.amount.toString(),
    })),
    permitData: {
      queryOutput,
      slippage,
    }
  };
}
